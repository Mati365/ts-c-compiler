import chalk from 'chalk';

import {IsOutputInstruction} from '../interfaces';
import {IROpcode} from '../constants';
import {IRConstant, IRInstructionVarArg, IRVariable, isIRConstant, isIRVariable} from '../variables';
import {IRInstruction} from './IRInstruction';

/**
 * Abstract operator instruction
 *
 * @export
 * @class IROpInstruction
 * @extends {IRInstruction}
 */
export class IROpInstruction<O> extends IRInstruction implements IsOutputInstruction {
  constructor(
    opcode: IROpcode,
    readonly operator: O,
    readonly leftVar: IRInstructionVarArg,
    readonly rightVar: IRInstructionVarArg,
    readonly outputVar: IRVariable = null,
  ) {
    super(opcode);
  }

  override getDisplayName(): string {
    const {leftVar, operator, rightVar, outputVar} = this;
    const str = `${leftVar?.getDisplayName()} ${chalk.yellowBright(operator)} ${rightVar.getDisplayName()}`;

    return (
      outputVar
        ? `${outputVar.getDisplayName()} = ${str}`
        : str
    );
  }

  getFirstVarArg() {
    const {leftVar, rightVar} = this;

    if (isIRVariable(leftVar))
      return leftVar;

    if (isIRVariable(rightVar))
      return rightVar;

    return null;
  }

  getFirstConstantArg() {
    const {leftVar, rightVar} = this;

    if (isIRConstant(leftVar))
      return leftVar;

    if (isIRConstant(rightVar))
      return rightVar;

    return null;
  }

  mapConstantArg(fn: (value: IRConstant, index: number) => IRConstant): this {
    const {operator, leftVar, rightVar, outputVar} = this;

    return new (this.constructor as any)(
      operator,
      isIRConstant(leftVar) ? fn(leftVar, 0) : leftVar,
      isIRConstant(rightVar) ? fn(rightVar, 1) : rightVar,
      outputVar,
    );
  }

  hasAnyConstantArg() {
    return this.getFirstConstantArg() !== null;
  }

  hasBothConstantArgs() {
    const {leftVar, rightVar} = this;

    return isIRConstant(leftVar) && isIRConstant(rightVar);
  }
}
