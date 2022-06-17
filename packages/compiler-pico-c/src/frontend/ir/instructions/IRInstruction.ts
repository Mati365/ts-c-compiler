import {IsPrintable} from '@compiler/core/interfaces';
import {IROpcode} from '../constants';
import {IRInstructionVarArg, IRVariable} from '../variables';

export type IRInstructionArgs = {
  input: IRInstructionVarArg[];
  output?: IRVariable;
};

/**
 * Basic IR block, contains mini operations similar to assembly
 *
 * @export
 * @abstract
 * @class IRInstruction
 * @implements {IsPrintable}
 */
export abstract class IRInstruction implements IsPrintable {
  constructor(
    readonly opcode: IROpcode,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ofArgs(args: IRInstructionArgs): IRInstruction {
    return this;
  }

  getArgs(): IRInstructionArgs {
    return {
      input: [],
      output: null,
    };
  }

  abstract getDisplayName(): string;
}
