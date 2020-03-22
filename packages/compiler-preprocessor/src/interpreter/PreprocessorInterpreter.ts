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

export class PreprocessorScope {
  public readonly variables = new Map<string, InterpreterResult>();
  public readonly callable = new Map<string, ASTPreprocessorCallable[]>();
}

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
   * Pushes preprocessor scope on top
   *
   * @param {(scope: PreprocessorScope) => void} fn
   * @returns {this}
   * @memberof PreprocessorInterpreter
   */
  enterScope(fn: (scope: PreprocessorScope) => void): this {
    const {_scopes} = this;
    const scope = new PreprocessorScope;

    _scopes.push(scope);
    fn(scope);
    _scopes.pop();

    return this;
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
   * @todo
   *  Handle already defined macro
   *
   * @param {ASTPreprocessorCallable} callable
   * @returns {this}
   * @memberof PreprocessorInterpreter
   */
  defineRuntimeCallable(callable: ASTPreprocessorCallable): this {
    const {rootScope} = this;
    const callables = this.getCallables(callable.name);

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
    } else
      rootScope.callable.set(callable.name, [callable]);

    return this;
  }

  /**
   * Checks if symbol is callable
   *
   * @param {string} name
   * @returns {ASTPreprocessorCallable}
   * @memberof PreprocessorInterpreter
   */
  getCallables(name: string): ASTPreprocessorCallable[] {
    return this.rootScope.callable.get(name);
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
      if (token.type !== TokenType.KEYWORD || (token.kind !== TokenKind.BRACKET_PREFIX && token.kind !== null))
        continue;

      const callables = this.getCallables(token.text);
      if (callables?.length) {
        // nested eval of macro, arguments might contain macro
        const it = new TokensIterator(newTokens, i + 1);
        const args = (
          newTokens[i + 1]?.text === '('
            ? fetchRuntimeCallArgsList(it).map((argTokens) => this.evalTokensList(argTokens)[1])
            : []
        );

        const callable = callables.find((item) => item.argsCount === args.length);
        if (callable) {
          const callResult = callable.runtimeCall(
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
              tokens[i].loc,
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
