import chalk from 'chalk';

import {IsOutputInstruction} from '../interfaces';
import {CIROpcode} from '../constants';
import {CIRInstructionVarArg, isCIRConstant, isCIRVariable} from '../variables';
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
    const str = `${leftVar.getDisplayName()} ${chalk.yellowBright(operator)} ${rightVar.getDisplayName()}`;

    return (
      outputVar
        ? `${chalk.blueBright(outputVar)} = ${str}`
        : str
    );
  }

  getFirstVarArg() {
    const {leftVar, rightVar} = this;

    if (isCIRVariable(leftVar))
      return leftVar;

    if (isCIRVariable(rightVar))
      return rightVar;

    return null;
  }

  getFirstConstantArg() {
    const {leftVar, rightVar} = this;

    if (isCIRConstant(leftVar))
      return leftVar;

    if (isCIRConstant(rightVar))
      return rightVar;

    return null;
  }

  hasAnyConstantArg() {
    return this.getFirstConstantArg() !== null;
  }

  hasBothConstantArgs() {
    const {leftVar, rightVar} = this;

    return isCIRConstant(leftVar) && isCIRConstant(rightVar);
  }
}
