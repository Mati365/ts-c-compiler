import { CRelOperator } from '@compiler/pico-c/constants';
import { TokenType } from '@compiler/lexer/shared';
import {
  CBackendError,
  CBackendErrorCode,
} from '@compiler/pico-c/backend/errors/CBackendError';

import {
  IRICmpInstruction,
  isIRBrInstruction,
} from '@compiler/pico-c/frontend/ir/instructions';

import {
  genInstruction,
  genLabelName,
  withInlineComment,
} from '../../asm-utils';

import { IRArgDynamicResolverType } from '../reg-allocator';
import { CompilerInstructionFnAttrs } from '../../constants/types';

const OPERATOR_JMP_INSTRUCTIONS: Record<CRelOperator, [string, string]> = {
  [TokenType.GREATER_THAN]: ['jg', 'jng'],
  [TokenType.GREATER_EQ_THAN]: ['jge', 'jnge'],
  [TokenType.LESS_THAN]: ['jl', 'jge'],
  [TokenType.LESS_EQ_THAN]: ['jle', 'jg'],
  [TokenType.EQUAL]: ['jz', 'jnz'],
  [TokenType.DIFFERS]: ['jnz', 'jz'],
};

type ICmpInstructionCompilerAttrs =
  CompilerInstructionFnAttrs<IRICmpInstruction>;

export function compileICmpInstruction({
  instruction,
  context,
}: ICmpInstructionCompilerAttrs): string[] {
  const {
    iterator,
    allocator: { regs },
  } = context;

  const { operator } = instruction;
  const brInstruction = iterator.next();

  if (!isIRBrInstruction(brInstruction)) {
    throw new CBackendError(CBackendErrorCode.MISSING_BR_INSTRUCTION);
  }

  const leftAllocResult = regs.tryResolveIrArg({
    arg: instruction.leftVar,
    allow: IRArgDynamicResolverType.MEM | IRArgDynamicResolverType.REG,
  });

  const rightAllocResult = regs.tryResolveIrArg({
    arg: instruction.rightVar,
    allow: IRArgDynamicResolverType.REG | IRArgDynamicResolverType.NUMBER,
  });

  const asm: string[] = [
    withInlineComment(
      genInstruction('cmp', leftAllocResult.value, rightAllocResult.value),
      instruction.getDisplayName(),
    ),
  ];

  const [ifTrueInstruction, ifFalseInstruction] =
    OPERATOR_JMP_INSTRUCTIONS[operator];

  if (brInstruction.ifTrue) {
    asm.push(
      withInlineComment(
        genInstruction(
          ifTrueInstruction,
          genLabelName(brInstruction.ifTrue.name),
        ),
        brInstruction.getDisplayName(),
      ),
    );
  }

  if (brInstruction.ifFalse) {
    asm.push(
      withInlineComment(
        genInstruction(
          ifFalseInstruction,
          genLabelName(brInstruction.ifFalse.name),
        ),
        brInstruction.getDisplayName(),
      ),
    );
  }

  if (!asm.length) {
    throw new CBackendError(CBackendErrorCode.UNABLE_TO_COMPILE_INSTRUCTION);
  }

  return asm;
}
