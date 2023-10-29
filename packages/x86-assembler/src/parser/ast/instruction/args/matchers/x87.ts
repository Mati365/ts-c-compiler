import { RegisterSchema } from '../../../../../constants';
import { InstructionArgType } from '../../../../../types';

import { ASTInstruction } from '../../ASTInstruction';
import { ASTInstructionArg } from '../ASTInstructionArg';
import { ASTInstructionRegisterArg } from '../ASTInstructionRegisterArg';

/** FPU */
export function x87reg(arg: ASTInstructionArg): RegisterSchema {
  if (arg.type !== InstructionArgType.REGISTER) {
    return null;
  }

  const regArg = (<ASTInstructionRegisterArg>arg).val;
  if (!regArg.x87) {
    return null;
  }

  return regArg;
}

export function x87sti(arg: ASTInstructionArg, index: number = null): boolean {
  const regArg = x87reg(arg);

  return regArg && (index === null || regArg.index === index);
}

export function x87st(arg: ASTInstructionArg, instruction: ASTInstruction) {
  const regArg = x87reg(arg);

  return regArg && (instruction.args.length === 1 || regArg.index === 0);
}
