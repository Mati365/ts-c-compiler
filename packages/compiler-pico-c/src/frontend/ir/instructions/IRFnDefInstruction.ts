import chalk from 'chalk';

import {IROpcode} from '../constants';
import {IRVariable} from '../variables';
import {IRInstruction} from './IRInstruction';
import {IsLabeledInstruction} from '../interfaces/IsLabeledInstruction';

export function isIRFnDefInstruction(instruction: IRInstruction): instruction is IRFnDefInstruction {
  return instruction.opcode === IROpcode.DEF;
}

/**
 * Definition of function
 *
 * @export
 * @class IRFnDefInstruction
 * @extends {IRInstruction}
 * @implements {IsLabeledInstruction}
 */
export class IRFnDefInstruction extends IRInstruction implements IsLabeledInstruction {
  constructor(
    readonly name: string,
    readonly args: IRVariable[] = [],
    readonly retByteSize: number = null,
    readonly variadic: boolean = false,
  ) {
    super(IROpcode.DEF);
  }

  override getDisplayName(): string {
    const {name, args, retByteSize} = this;
    const argsStr = args.map((arg) => arg.getDisplayName()).join(', ');

    return `${chalk.bold.yellow('def')} ${chalk.bold.white(name)}(${argsStr}): [ret ${retByteSize || 0}B]`;
  }
}
