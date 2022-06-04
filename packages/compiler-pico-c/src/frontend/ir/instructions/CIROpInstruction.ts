import chalk from 'chalk';

import {IsOutputInstruction} from '../interfaces';
import {CIROpcode} from '../constants';
import {CIRConstant, CIRInstructionVarArg, CIRVariable, isCIRConstant, isCIRVariable} from '../variables';
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
    readonly outputVar: CIRVariable = null,
  ) {
    super(opcode);
  }

  override getDisplayName(): string {
    const {leftVar, operator, rightVar, outputVar} = this;
    const str = `${leftVar?.getDisplayName()} ${chalk.yellowBright(operator)} ${rightVar.getDisplayName()}`;

    return (
      outputVar
        ? `${outputVar.getDisplayName(false)} = ${str}`
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

  mapConstantArg(fn: (value: CIRConstant, index: number) => CIRConstant): this {
    const {operator, leftVar, rightVar, outputVar} = this;

    return new (this.constructor as any)(
      operator,
      isCIRConstant(leftVar) ? fn(leftVar, 0) : leftVar,
      isCIRConstant(rightVar) ? fn(rightVar, 1) : rightVar,
      outputVar,
    );
  }

  hasAnyConstantArg() {
    return this.getFirstConstantArg() !== null;
  }

  hasBothConstantArgs() {
    const {leftVar, rightVar} = this;

    return isCIRConstant(leftVar) && isCIRConstant(rightVar);
  }
}
