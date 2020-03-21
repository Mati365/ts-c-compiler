import {ASTPreprocessorMacro} from '../nodes';
import {ASTPreprocessorNode} from '../constants';

export type InterpreterResult = string | number | boolean | void;

export interface Interpretable {
  exec(interpreter: PreprocessorInterpreter): InterpreterResult;
}

export class PreprocessorInterpreter {
  private _macros: ASTPreprocessorMacro[];
  private _defs: ASTPreprocessorMacro[];

  exec(ast: ASTPreprocessorNode): void {
    console.log(ast); // eslint-disable-line
  }
}
