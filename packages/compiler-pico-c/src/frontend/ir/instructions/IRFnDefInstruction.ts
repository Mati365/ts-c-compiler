import chalk from 'chalk';

import {getIRTypeDisplayName} from '../dump/getIRTypeDisplayName';

import {CFunctionDeclType, CType} from '../../analyze';
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
    readonly type: CFunctionDeclType,
    readonly name: string,
    readonly args: IRVariable[],
    readonly returnRegType?: CType,
    readonly outputVarPtr: IRVariable = null,
    readonly variadic: boolean = false,
  ) {
    super(IROpcode.DEF);
  }

  isVoid() {
    const {returnRegType, outputVarPtr} = this;

    return !returnRegType && !outputVarPtr;
  }

  override getDisplayName(): string {
    const {
      name,
      args,
      returnRegType,
      outputVarPtr,
    } = this;

    const serializedArgs = args.map((arg) => arg.getDisplayName());
    const retStr = returnRegType ? `: [ret${getIRTypeDisplayName(returnRegType)}]` : ':';

    if (outputVarPtr) {
      serializedArgs.push(
        outputVarPtr.getDisplayName(),
      );
    }

    return (
      `${chalk.bold.yellow('def')} ${chalk.bold.white(name)}(${serializedArgs.join(', ')})${retStr}`
    );
  }
}
