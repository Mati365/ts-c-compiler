import chalk from 'chalk';

import {CIROpcode} from '../constants';
import {CIRVariable} from '../variables';
import {CIRInstruction} from './CIRInstruction';
import {IsLabeledInstruction} from '../interfaces/IsLabeledInstruction';

export function isIRFnDefInstruction(instruction: CIRInstruction): instruction is CIRFnDefInstruction {
  return instruction.opcode === CIROpcode.DEF;
}

/**
 * Definition of function
 *
 * @export
 * @class CIRFnDefInstruction
 * @extends {CIRInstruction}
 * @implements {IsLabeledInstruction}
 */
export class CIRFnDefInstruction extends CIRInstruction implements IsLabeledInstruction {
  constructor(
    readonly name: string,
    readonly args: CIRVariable[] = [],
    readonly retByteSize: number = null,
    readonly variadic: boolean = false,
  ) {
    super(CIROpcode.DEF);
  }

  override getDisplayName(): string {
    const {name, args, retByteSize} = this;
    const argsStr = args.map((arg) => arg.getDisplayName()).join(', ');

    return `${chalk.bold.yellow('def')} ${chalk.bold.white(name)}(${argsStr}): [ret ${retByteSize || 0}B]`;
  }
}
