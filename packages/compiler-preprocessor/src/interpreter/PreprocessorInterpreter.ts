import {ASTPreprocessorNode} from '../constants';
import {
  ASTPreprocessorMacro,
  ASTPreprocessorDefine,
} from '../nodes';

export type InterpreterResult = string | number | boolean | void;

export interface PreprocessorInterpretable {
  exec(interpreter: PreprocessorInterpreter): InterpreterResult;
}

export class PreprocessorInterpreter {
  private _macros = new Map<string, ASTPreprocessorMacro>();
  private _defs = new Map<string, ASTPreprocessorDefine>();

  exec(ast: ASTPreprocessorNode): void {
    this.clear();
    ast.exec(this);
  }

  /**
   * Sets macro to defined macros list
   *
   * @param {ASTPreprocessorMacro} macro
   * @returns {this}
   * @memberof PreprocessorInterpreter
   */
  defineMacro(macro: ASTPreprocessorMacro): this {
    this._macros.set(macro.name, macro);
    return this;
  }

  /**
   * Sets %define stmt
   *
   * @param {ASTPreprocessorDefine} def
   * @returns {this}
   * @memberof PreprocessorInterpreter
   */
  define(def: ASTPreprocessorDefine): this {
    this._defs.set(def.name, def);
    return this;
  }

  /**
   * Resets interpereter state
   *
   * @memberof PreprocessorInterpreter
   */
  clear() {
    const {_macros, _defs} = this;

    _macros.clear();
    _defs.clear();
  }
}
