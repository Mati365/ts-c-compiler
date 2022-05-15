import {CIROpcode} from '../constants';
import {
  CIRInstruction,
  CIRInstructionVarArg,
  CIRVarName,
} from './CIRInstruction';

/**
 * Abstract operator instruction
 *
 * @export
 * @class CIROpInstruction
 * @extends {CIRInstruction}
 */
export class CIROpInstruction<O> extends CIRInstruction {
  constructor(
    opcode: CIROpcode,
    readonly operator: O,
    readonly leftVar: CIRInstructionVarArg,
    readonly rightVar: CIRInstructionVarArg,
    readonly outputVar?: CIRVarName,
  ) {
    super(opcode);
  }

  override getDisplayName(): string {
    const {leftVar, operator, rightVar, outputVar} = this;
    const str = `${leftVar} ${operator} ${rightVar}`;

    return (
      outputVar
        ? `${outputVar} = ${str}`
        : str
    );
  }
}
