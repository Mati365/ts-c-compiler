import {IsOutputInstruction} from '../interfaces';
import {CIROpcode} from '../constants';
import {CIRInstructionVarArg} from '../variables';
import {CIRInstruction} from './CIRInstruction';

/**
 * Abstract operator instruction
 *
 * @export
 * @class CIROpInstruction
 * @extends {CIRInstruction}
 */
export class CIROpInstruction<O> extends CIRInstruction implements IsOutputInstruction {
  constructor(
    opcode: CIROpcode,
    readonly operator: O,
    readonly leftVar: CIRInstructionVarArg,
    readonly rightVar: CIRInstructionVarArg,
    readonly outputVar: string = null,
  ) {
    super(opcode);
  }

  override getDisplayName(): string {
    const {leftVar, operator, rightVar, outputVar} = this;
    const str = `${leftVar.getDisplayName()} ${operator} ${rightVar.getDisplayName()}`;

    return (
      outputVar
        ? `${outputVar} = ${str}`
        : str
    );
  }
}
