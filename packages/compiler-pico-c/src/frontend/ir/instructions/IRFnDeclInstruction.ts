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
  return !!instruction && instruction.opcode === IROpcode.FN_DECL;
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
    private rvoOutputVar: IRVariable = null,
    readonly variadic: boolean = false,
  ) {
    super(IROpcode.FN_DECL);
  }

  hasReturnValue() {
    return !!this.returnType;
  }

  hasRVO() {
    return !!this.rvoOutputVar;
  }

  hasVaListArgs() {
    return this.type.hasVaListArgs();
  }

  getRVOOutputVar() {
    return this.rvoOutputVar;
  }

  setRVOOutputVar(rvoVar: IRVariable) {
    this.rvoOutputVar = rvoVar;
  }

  getArgsWithRVO() {
    const { args, rvoOutputVar } = this;

    return rvoOutputVar ? [...args, rvoOutputVar] : args;
  }

  isVoid() {
    const { returnType, rvoOutputVar } = this;

    return !returnType && !rvoOutputVar;
  }

  override getDisplayName(): string {
    const { name, args, returnType, rvoOutputVar } = this;

    const serializedArgs = args.map(arg => arg.getDisplayName());
    const retStr = returnType
      ? `: [ret${getIRTypeDisplayName(returnType)}]`
      : ':';

    if (this.hasVaListArgs()) {
      serializedArgs.push('...');
    }

    if (rvoOutputVar) {
      serializedArgs.push(`rvo: ${rvoOutputVar.getDisplayName()}`);
    }

    return `${chalk.bold.yellow('def')} ${chalk.bold.white(
      name,
    )}(${serializedArgs.join(', ')})${retStr}`;
  }
}
