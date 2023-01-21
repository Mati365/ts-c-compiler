import { IRLoadInstruction } from '@compiler/pico-c/frontend/ir/instructions';
import {
  CBackendError,
  CBackendErrorCode,
} from '@compiler/pico-c/backend/errors/CBackendError';

import { isIRVariable } from '@compiler/pico-c/frontend/ir/variables';
import { isPointerLikeType } from '@compiler/pico-c/frontend/analyze';

import { CompilerFnAttrs } from '../../constants/types';
import { genInstruction, withInlineComment } from '../../asm-utils';
import { isStackVarOwnership } from '../reg-allocator/utils';

type LoadInstructionCompilerAttrs = CompilerFnAttrs & {
  instruction: IRLoadInstruction;
};

export function compileLoadInstruction({
  instruction,
  context,
}: LoadInstructionCompilerAttrs): string[] {
  const { inputVar, outputVar } = instruction;
  const {
    allocator: { regs, stackFrame },
  } = context;

  if (!isIRVariable(inputVar)) {
    return;
  }

  const asm: string[] = [];

  if (inputVar.isTemporary()) {
    // handle loading pointer to types, such as %t{0} = load %t{1}: int*
    const input = regs.tryResolveIRArgAsReg({
      arg: inputVar,
      specificReg: 'bx',
    });

    regs.ownership.transferRegOwnership(outputVar.name, input.value);
    asm.push(
      withInlineComment(
        genInstruction('mov', input.value, `[${input.value}]`),
        instruction.getDisplayName(),
      ),
    );
  } else {
    if (
      isPointerLikeType(inputVar.type) &&
      isPointerLikeType(inputVar.type.baseType)
    ) {
      // handle loading pointer to types, such as **k
      const reg = regs.requestReg({
        size: inputVar.type.getByteSize(),
        reg: 'bx',
      });

      asm.push(
        ...reg.asm,
        withInlineComment(
          genInstruction(
            'mov',
            reg.value,
            stackFrame.getLocalVarStackRelAddress(inputVar.name),
          ),
          instruction.getDisplayName(),
        ),
      );

      regs.ownership.setOwnership(outputVar.name, {
        reg: reg.value,
      });
    } else {
      // handle loading pointer to types, such as *k
      const cachedOwnership = regs.ownership.getVarOwnership(inputVar.name);

      if (!isStackVarOwnership(cachedOwnership)) {
        throw new CBackendError(CBackendErrorCode.UNKNOWN_BACKEND_ERROR);
      }

      regs.ownership.setOwnership(outputVar.name, {
        stackVar: cachedOwnership.stackVar,
      });
    }
  }

  return asm;
}
