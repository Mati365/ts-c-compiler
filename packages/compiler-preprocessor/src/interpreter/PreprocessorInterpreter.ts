import * as R from 'ramda';

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
          const str = node.toEmitterLine().trim();
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
  evalTokensList(tokens: Token[]): [boolean, Token[]] {
    let newTokens: Token[] = tokens;

    for (let i = 0; i < newTokens.length; ++i) {
      const token = newTokens[i];
      const {loc} = token;

      if (token.type !== TokenType.KEYWORD || (token.kind !== TokenKind.BRACKET_PREFIX && token.kind !== null))
        continue;

      // catch $0, $1 etc macro inner variables
      if (token.text[0] === '%') {
        const result = this.getVariable(token.text);

        if (result === null) {
          throw new GrammarError(
            GrammarErrorCode.UNKNOWN_MACRO_VARIABLE,
            loc,
            {
              name: token.text,
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
        continue;
      }

      // catch macros calls
      const callables = this.getCallables(token.text);
      if (callables?.length) {
        // nested eval of macro, arguments might contain macro
        const it = new TokensIterator(newTokens, i + 1);
        const inline = i > 0; // inline macro calls are generally inside instruction

        const args = (
          !inline || newTokens[i + 1]?.text === '('
            ? fetchRuntimeCallArgsList(it).map((argTokens) => this.evalTokensList(argTokens)[1])
            : []
        );

        const callable = callables.find((item) => item.argsCount === args.length);
        if (callable) {
          const callResult = callable.runtimeCall(
            this,
            R.map(
              (argTokens) => R.pluck('text', argTokens).join(''),
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
   * Resets interpereter state
   *
   * @memberof PreprocessorInterpreter
   */
  clear() {
    this._scopes = [

    ];
  }
}
