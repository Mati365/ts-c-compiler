import {IsOutputInstruction} from '../interfaces';

import {IROpcode} from '../constants';
import {IRInstruction, IRInstructionArgs} from './IRInstruction';
import {IRVariable} from '../variables';

/**
 * PHI instruction
 *
 * @export
 * @class IRPhiInstruction
 * @extends {IRInstruction}
 * @implements {IsOutputInstruction}
 */
export class IRPhiInstruction extends IRInstruction implements IsOutputInstruction {
  constructor(
    readonly vars: IRVariable[],
    readonly outputVar: IRVariable,
  ) {
    super(IROpcode.PHI);
  }

  override ofArgs(
    {
      input = this.vars,
      output = this.outputVar,
    }: IRInstructionArgs,
  ) {
    return new IRPhiInstruction(<IRVariable[]> input, output);
  }

  override getArgs(): IRInstructionArgs {
    const {vars, outputVar} = this;

    return {
      input: vars,
      output: outputVar,
    };
  }

  override getDisplayName(): string {
    const {outputVar, vars} = this;

    return `${outputVar} = φ(${vars.join(', ')})`;
  }
}
