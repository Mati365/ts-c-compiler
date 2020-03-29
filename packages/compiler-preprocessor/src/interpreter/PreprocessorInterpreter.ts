import * as R from 'ramda';

import {rpn} from '@compiler/rpn/rpn';
import {extractNestableTokensList} from '@compiler/lexer/utils/extractNestableTokensList';
import {joinTokensTexts} from '@compiler/lexer/utils/joinTokensTexts';

import {TokensIterator} from '@compiler/grammar/tree/TokensIterator';
import {
  Token,
  TokenType,
  TokenKind,
} from '@compiler/lexer/tokens';

import {
  GrammarError,
  GrammarErrorCode,
} from '@compiler/grammar/GrammarError';

import {TreeVisitor} from '@compiler/grammar/tree/TreeVisitor';
import {ASTPreprocessorNode, isStatementPreprocessorNode} from '../constants';
import {ASTPreprocessorCallable} from '../nodes';
import {ExpressionResultTreeVisitor} from './ExpressionResultTreeVisitor';

import {fetchRuntimeCallArgsList} from './utils/fetchRuntimeCallArgsList';

export type InterpreterResult = string | number | boolean | void;

export interface PreprocessorInterpretable {
  exec(interpreter: PreprocessorInterpreter): InterpreterResult;
  toEmitterLine(): string;
}

/**
 * Preprocessor function context, contains variables, macros etc
 *
 * @export
 * @class PreprocessorScope
 */
export class PreprocessorScope {
  constructor(
    public readonly variables = new Map<string, InterpreterResult>(),
    public readonly callable = {
      sensitive: new Map<string, ASTPreprocessorCallable[]>(),
      nonSensitive: new Map<string, ASTPreprocessorCallable[]>(),
    },
  ) {}
}

/**
 * Main interpreter logic
 *
 * @export
 * @class PreprocessorInterpreter
 */
export class PreprocessorInterpreter {
  private _scopes: PreprocessorScope[] = [
    new PreprocessorScope,
  ];

  get rootScope(): PreprocessorScope {
    return this._scopes[0];
  }

  get currentScope(): PreprocessorScope {
    return R.last(this._scopes);
  }

  /**
   * Pushes preprocessor scope on top, exec fn and pops
   *
   * @template R
   * @param {[string, InterpreterResult][]} [variables=[]]
   * @param {(scope: PreprocessorScope) => R} fn
   * @returns {R}
   * @memberof PreprocessorInterpreter
   */
  enterScope<R = void>(
    variables: [string, InterpreterResult][],
    fn: (scope: PreprocessorScope) => R,
  ): R {
    const {_scopes} = this;
    const scope = new PreprocessorScope(
      new Map<string, InterpreterResult>(variables || []),
    );

    _scopes.push(scope);
    const result = fn(scope);
    _scopes.pop();

    return result;
  }

  /**
   * Evaluates all macros, replaces them with empty lines
   *
   * @see
   *  Preserves lines numbers but not columns!
   *
   * @param {ASTPreprocessorNode} ast
   * @returns {string}
   * @memberof PreprocessorInterpreter
   */
  exec(ast: ASTPreprocessorNode): string {
    let acc = '';

    ast.exec(this);

    const visitor = new (class extends TreeVisitor<ASTPreprocessorNode> {
      enter(node: ASTPreprocessorNode) {
        if (!isStatementPreprocessorNode(node))
          return;

        if (this.nesting === 2) {
          const str = node.toEmitterLine();
          if (str)
            acc += `${str}\n`;
        }
      }
    });

    visitor.visit(ast);
    return acc;
  }

  /**
   * Declares function that can be executed in ASTPreprocessorSyntaxLine
   *
   * @param {ASTPreprocessorCallable} callable
   * @returns {this}
   * @memberof PreprocessorInterpreter
   */
  defineRuntimeCallable(callable: ASTPreprocessorCallable): this {
    const {rootScope} = this;
    const {caseSensitive} = callable;

    const callables = this.getCallables(callable.name, caseSensitive);

    if (callables) {
      if (callables.some((item) => item.argsCount === callable.argsCount)) {
        throw new GrammarError(
          GrammarErrorCode.MACRO_ALREADY_EXISTS,
          null,
          {
            name: callable.name,
          },
        );
      }

      callables.push(callable);
    } else {
      const {sensitive, nonSensitive} = rootScope.callable;
      if (caseSensitive)
        sensitive.set(callable.name, [callable]);
      else
        nonSensitive.set(R.toLower(callable.name), [callable]);
    }

    return this;
  }

  /**
   * Checks if symbol is callable
   *
   * @param {string} name
   * @param {boolean} [caseSensitive=true]
   * @returns {ASTPreprocessorCallable[]}
   * @memberof PreprocessorInterpreter
   */
  getCallables(name: string, caseIntensive: boolean = true): ASTPreprocessorCallable[] {
    const {sensitive, nonSensitive} = this.rootScope.callable;
    const sensitiveResult = sensitive.get(name);
    if (caseIntensive && sensitiveResult)
      return sensitiveResult;

    const nonSensitiveResult = nonSensitive.get(R.toLower(name));
    if (sensitiveResult && nonSensitiveResult) {
      return [
        ...sensitiveResult,
        ...sensitive.get(name),
      ];
    }

    return sensitiveResult ?? nonSensitiveResult;
  }

  /**
   * Iterates from current scope to rootScope, if not found returns null
   *
   * @param {string} name
   * @returns {InterpreterResult}
   * @memberof PreprocessorInterpreter
   */
  getVariable(name: string): InterpreterResult {
    const {_scopes} = this;

    for (let i = _scopes.length - 1; i >= 0; --i) {
      const {variables} = _scopes[i];

      if (variables.has(name))
        return variables.get(name);
    }

    return null;
  }

  /**
   * Removes all macro calls from list of tokens
   *
   * @param {Token[]} tokens
   * @returns {[boolean, Token[]]}
   * @memberof PreprocessorInterpreter
   */
  removeMacrosFromTokens(tokens: Token[]): [boolean, Token[]] {
    let newTokens: Token[] = tokens;
    let inInlineMacroExp = false;

    for (let i = 0; i < newTokens.length; ++i) {
      const [token, nextToken] = [newTokens[i], newTokens[i + 1]];
      const {loc, text, type, kind} = token;

      // handle DUPA%[asdasd]
      // just explode token here and reset offset
      const inlineMacroExpression = text.length > 1 && R.endsWith('%', text) && nextToken?.text === '[';
      if (inlineMacroExpression) {
        newTokens[i] = new Token(TokenType.KEYWORD, null, R.init(text), loc);
        newTokens = R.insert(
          i + 1,
          new Token(TokenType.KEYWORD, null, '%', loc),
          newTokens,
        );

        inInlineMacroExp = true;
        i--; // repeat current loop step
        continue;
      }

      // ignore keywords
      if (type !== TokenType.KEYWORD || (kind !== TokenKind.BRACKET_PREFIX && kind !== null))
        continue;

      // catch %0, %1, %[] etc macro inner variables
      if (text[0] === '%') {
        if (nextToken?.text[0] === '[') {
          // expressions %[]
          const [content, newOffset] = extractNestableTokensList(
            {
              up: (t) => t.text === '[',
              down: (t) => t.text === ']',
            },
            tokens,
            i,
          );

          content.shift(); // drop ]
          content.pop(); // drop [

          // handle case DUPA%[asdasd], DUPA% is the same token
          if (inInlineMacroExp) {
            newTokens = [
              ...newTokens.slice(0, i - 1),
              new Token(
                TokenType.KEYWORD,
                null,
                `${tokens[i - 1]}${this.evalTokensExpression(content).toString()}`,
                loc,
              ),
              ...newTokens.slice(newOffset),
            ];
          } else {
            newTokens = [
              ...newTokens.slice(0, i),
              new Token(
                TokenType.KEYWORD,
                null,
                this.evalTokensExpression(content).toString(),
                loc,
              ),
              ...newTokens.slice(newOffset),
            ];
          }

          i = newOffset;
        } else {
          // variables, %0
          const result = this.getVariable(text);

          if (result === null) {
            throw new GrammarError(
              GrammarErrorCode.UNKNOWN_MACRO_VARIABLE,
              loc,
              {
                name: text,
              },
            );
          }

          newTokens = R.update(
            i,
            new Token(
              TokenType.KEYWORD,
              null,
              <string> result,
              loc,
            ),
            newTokens,
          );
        }

        continue;
      }

      // catch macros calls
      const callables = this.getCallables(text);
      if (callables?.length) {
        // nested eval of macro, arguments might contain macro
        const it = new TokensIterator(newTokens, i + 1);

        // inline macro calls are generally inside instruction
        // or have no args, example:
        // %define dupa mov
        // dupa ax, bx
        const inline = i > 0 || !callables.some(({argsCount}) => argsCount > 0);

        const args = (
          !inline || newTokens[i + 1]?.text === '('
            ? fetchRuntimeCallArgsList(it).map((argTokens) => this.removeMacrosFromTokens(argTokens)[1])
            : []
        );

        const callable = callables.find(
          (item) => item.argsCount === args.length,
        );
        if (callable) {
          const callResult = callable.runtimeCall(
            this,
            R.map(
              (argTokens) => joinTokensTexts('', argTokens),
              args,
            ),
          );

          newTokens = [
            ...newTokens.slice(0, i),
            new Token(
              TokenType.KEYWORD,
              null,
              callResult,
              loc,
            ),
            ...newTokens.slice(it.getTokenIndex() + +args.length), // +args.length, if args.length > 0 there must be ()
          ];
        }
      }
    }

    return [
      newTokens !== tokens,
      newTokens,
    ];
  }

  /**
   * Evaluates inline
   *
   * @param {Token[]} tokens
   * @returns {number}
   * @memberof PreprocessorInterpreter
   */
  evalTokensExpression(tokens: Token[]): number {
    const expression = joinTokensTexts('', this.removeMacrosFromTokens(tokens)[1]);
    const value = rpn(
      expression,
      {
        keywordResolver: (name) => +this.rootScope.variables.get(name),
      },
    );

    if (Number.isNaN(value)) {
      throw new GrammarError(
        GrammarErrorCode.INCORRECT_MATH_EXPRESSION,
        null,
        {
          expression,
        },
      );
    }

    return value;
  }

  /**
   * Evaluates expression used in ifs, loops etc
   *
   * @param {ASTPreprocessorNode} expression
   * @returns {InterpreterResult}
   * @memberof PreprocessorInterpreter
   */
  evalExpression(expression: ASTPreprocessorNode): InterpreterResult {
    const visitor = new ExpressionResultTreeVisitor(this);

    return visitor.visit(expression).value;
  }

  /**
   * Resets interpereter state
   *
   * @memberof PreprocessorInterpreter
   */
  clear() {
    this._scopes = [
      new PreprocessorScope,
    ];
  }
}
