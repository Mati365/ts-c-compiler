import {ASTPreprocessorNode} from '../constants';
import {
  ASTPreprocessorCallable,
  ASTPreprocessorRuntimeArg,
} from '../nodes';

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
   * @param {ASTPreprocessorRuntimeArg[]} [args=[]]
   * @returns {string}
   * @memberof PreprocessorInterpreter
   */
  runtimeCall(name: string, args: ASTPreprocessorRuntimeArg[] = []): string {
    return this._callable.get(name).runtimeCall(args);
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
