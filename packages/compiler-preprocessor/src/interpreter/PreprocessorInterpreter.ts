import * as R from 'ramda';

import {appendToMapKeyArray} from '@compiler/core/utils/appendToMapKeyArray';
import {rpn} from '@compiler/rpn/rpn';
import {extractNestableTokensList} from '@compiler/lexer/utils/extractNestableTokensList';
import {joinTokensTexts} from '@compiler/lexer/utils/joinTokensTexts';

import {TokensIterator} from '@compiler/grammar/tree/TokensIterator';
import {
  Token,
  TokenType,
  TokenKind,
} from '@compiler/lexer/tokens';

import {TreeVisitor} from '@compiler/grammar/tree/TreeVisitor';
import {ASTPreprocessorNode, isStatementPreprocessorNode} from '../constants';
import {ASTPreprocessorCallable} from '../nodes';
import {ExpressionResultTreeVisitor} from './ExpressionResultTreeVisitor';
import {
  PreprocessorError,
  PreprocessorErrorCode,
} from '../PreprocessorError';

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
   * Removes macro
   *
   * @param {string} name
   * @param {boolean} [caseIntensive=true]
   * @memberof PreprocessorInterpreter
   */
  undefRuntimeCallable(name: string, caseIntensive: boolean = true): void {
    const {sensitive, nonSensitive} = this.rootScope.callable;

    nonSensitive.delete(name);
    if (caseIntensive)
      sensitive.delete(name);
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

    // find duplicates
    const callables = this.getCallables(callable.name, caseSensitive);
    const duplicatedMacro = callables && callables.some((item) => item.argsCount === callable.argsCount);

    // do not redefine inline macro and macro
    if (duplicatedMacro || (callables?.length && !callable.argsCount)) {
      if (duplicatedMacro && !callable.argsCount && callables.length === 1) {
        // allow redefine only if one is defined (one defined = one args set)
        this.undefRuntimeCallable(callable.name, caseSensitive);
      } else {
        // for inline macros allow redefine
        throw new PreprocessorError(
          PreprocessorErrorCode.MACRO_ALREADY_EXISTS,
          null,
          {
            name: callable.name,
          },
        );
      }
    }

    const {sensitive, nonSensitive} = rootScope.callable;
    if (caseSensitive)
      appendToMapKeyArray(callable.name, callable, sensitive);
    else {
      const lowerName = R.toLower(callable.name);
      appendToMapKeyArray(lowerName, callable, nonSensitive);
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
      const inlineMacroExpression = (
        text.length > 1
          && R.endsWith('%', text)
          && nextToken?.text === '['
      );
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
            throw new PreprocessorError(
              PreprocessorErrorCode.UNKNOWN_MACRO_VARIABLE,
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
        const bracketCall = newTokens[i + 1]?.text === '('; // handle; abc(2, 3)
        const args = (
          !inline || bracketCall
            ? fetchRuntimeCallArgsList(it, bracketCall ? 1 : 0).map(
              (argTokens) => this.removeMacrosFromTokens(argTokens)[1],
            )
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
            ...newTokens.slice(it.getTokenIndex() + Math.max(0, +args.length - 1)),
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
      throw new PreprocessorError(
        PreprocessorErrorCode.INCORRECT_MATH_EXPRESSION,
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
