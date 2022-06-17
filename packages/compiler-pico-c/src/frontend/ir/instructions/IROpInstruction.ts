import * as R from 'ramda';
import chalk from 'chalk';

import {IsOutputInstruction} from '../interfaces';
import {IROpcode} from '../constants';
import {IRInstruction, IRInstructionArgs} from './IRInstruction';
import {
  IRConstant, IRInstructionVarArg,
  IRVariable, isIRConstant, isIRVariable,
} from '../variables';

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

  override ofArgs(
    {
      input = [this.leftVar, this.rightVar],
      output = this.outputVar,
    }: IRInstructionArgs,
  ) {
    const {opcode, operator} = this;

    return new IROpInstruction(
      opcode,
      operator,
      <IRVariable> input[0],
      <IRVariable> input[1],
      output,
    );
  }

  override getArgs(): IRInstructionArgs {
    const {leftVar, rightVar, outputVar} = this;

    return {
      input: [leftVar, rightVar],
      output: outputVar,
    };
  }

  override getDisplayName(): string {
    const {leftVar, operator, rightVar, outputVar} = this;
    const str = [
      leftVar?.getDisplayName(),
      chalk.yellowBright(R.toLower(operator as any)),
      rightVar.getDisplayName(),
    ].join(' ');

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
