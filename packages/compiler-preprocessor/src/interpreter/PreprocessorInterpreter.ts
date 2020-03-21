import * as R from 'ramda';

import {TokensIterator} from '@compiler/grammar/tree/TokensIterator';
import {
  Token,
  TokenType,
} from '@compiler/lexer/tokens';

import {ASTPreprocessorNode} from '../constants';
import {ASTPreprocessorCallable} from '../nodes';
import {fetchRuntimeCallArgsList} from './utils/fetchRuntimeCallArgsList';

export type InterpreterResult = string | number | boolean | void;

export interface PreprocessorInterpretable {
  exec(interpreter: PreprocessorInterpreter): InterpreterResult;
}

export class PreprocessorInterpreter {
  private _callable = new Map<string, ASTPreprocessorCallable>();

  exec(ast: ASTPreprocessorNode): void {
    this.clear();
    ast.exec(this);
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
    this._callable.set(callable.name, callable);
    return this;
  }

  /**
   * Checks if symbol is callable
   *
   * @param {string} name
   * @returns {boolean}
   * @memberof PreprocessorInterpreter
   */
  isCallable(name: string): boolean {
    return this._callable.has(name);
  }

  /**
   * Calls defined function
   *
   * @todo
   *  Handle missing method
   *
   * @param {string} name
   * @param {string[]} [args=[]]
   * @returns {string}
   * @memberof PreprocessorInterpreter
   */
  runtimeCall(name: string, args: string[] = []): string {
    return this._callable.get(name).runtimeCall(args);
  }

  /**
   * Removes all macro calls from list of tokens
   *
   * @param {Token[]} tokens
   * @returns {[boolean, Token[]]}
   * @memberof PreprocessorInterpreter
   */
  evalTokensList(tokens: Token[]): [boolean, Token[]] {
    let newTokens: Token[] = [...tokens];
    let foundMacro: boolean = false;

    for (let i = 0; i < newTokens.length; ++i) {
      const token = newTokens[i];
      if (token.type !== TokenType.KEYWORD || !this.isCallable(token.text))
        continue;

      // nested eval of macro, arguments might contain macro
      const it = new TokensIterator(newTokens, i + 1);
      const args = fetchRuntimeCallArgsList(it).map((argTokens) => this.evalTokensList(argTokens)[1]);
      const callResult = this.runtimeCall(
        token.text,
        R.map(
          (argTokens) => R.pluck('text', argTokens).join(''),
          args,
        ),
      );

      foundMacro = true;
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

    return [foundMacro, newTokens];
  }

  /**
   * Resets interpereter state
   *
   * @memberof PreprocessorInterpreter
   */
  clear() {
    const {_callable} = this;

    _callable.clear();
  }
}
