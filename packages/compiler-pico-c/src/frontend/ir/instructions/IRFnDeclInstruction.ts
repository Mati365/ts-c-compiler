import chalk from 'chalk';

import { getIRTypeDisplayName } from '../dump/getIRTypeDisplayName';

import { CFunctionDeclType, CType } from '../../analyze';
import { IROpcode } from '../constants';
import { IRVariable } from '../variables';
import { IRInstruction } from './IRInstruction';
import { IsLabeledInstruction } from '../interfaces/IsLabeledInstruction';

export function isIRFnDeclInstruction(
  instruction: IRInstruction,
): instruction is IRFnDeclInstruction {
  return instruction.opcode === IROpcode.FN_DECL;
}

/**
 * Declaration of function
 */
export class IRFnDeclInstruction
  extends IRInstruction
  implements IsLabeledInstruction
{
  constructor(
    readonly type: CFunctionDeclType,
    readonly name: string,
    readonly args: IRVariable[],
    readonly returnType?: CType,
    readonly outputVar: IRVariable = null,
    readonly variadic: boolean = false,
  ) {
    super(IROpcode.FN_DECL);
  }

  getArgsWithRVO() {
    const { args, outputVar } = this;

    return outputVar ? [...args, outputVar] : args;
  }

  hasReturnValue() {
    return !!this.returnType;
  }

  isVoid() {
    const { returnType, outputVar } = this;

    return !returnType && !outputVar;
  }

  override getDisplayName(): string {
    const { name, args, returnType, outputVar } = this;

    const serializedArgs = args.map(arg => arg.getDisplayName());
    const retStr = returnType
      ? `: [ret${getIRTypeDisplayName(returnType)}]`
      : ':';

    if (outputVar) {
      serializedArgs.push(outputVar.getDisplayName());
    }

    return `${chalk.bold.yellow('def')} ${chalk.bold.white(
      name,
    )}(${serializedArgs.join(', ')})${retStr}`;
  }
}
