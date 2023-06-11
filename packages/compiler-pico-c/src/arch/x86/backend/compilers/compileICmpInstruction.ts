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
import { X86CompilerInstructionFnAttrs } from '../../constants/types';
import { getBiggerIRArg } from '@compiler/pico-c/frontend/ir/utils';
import { isPrimitiveLikeType } from '@compiler/pico-c/frontend/analyze';

const OPERATOR_JMP_INSTRUCTIONS: Record<
  CRelOperator,
  Record<'signed' | 'unsigned', [string, string]>
> = {
  [TokenType.GREATER_THAN]: {
    signed: ['jg', 'jng'],
    unsigned: ['ja', 'jbe'],
  },
  [TokenType.GREATER_EQ_THAN]: {
    signed: ['jge', 'jnge'],
    unsigned: ['jb', 'jnae'],
  },
  [TokenType.LESS_THAN]: {
    signed: ['jl', 'jge'],
    unsigned: ['jb', 'jnb'],
  },
  [TokenType.LESS_EQ_THAN]: {
    signed: ['jle', 'jg'],
    unsigned: ['jbe', 'ja'],
  },
  [TokenType.EQUAL]: {
    signed: ['jz', 'jnz'],
    unsigned: ['jz', 'jnz'],
  },
  [TokenType.DIFFERS]: {
    signed: ['jnz', 'jz'],
    unsigned: ['jnz', 'jz'],
  },
};

type ICmpInstructionCompilerAttrs =
  X86CompilerInstructionFnAttrs<IRICmpInstruction>;

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

  // handle case when we compare int with char like this:
  // if (a: int > b: char) { ... }
  const argSize = getBiggerIRArg(
    instruction.leftVar,
    instruction.rightVar,
  ).type.getByteSize();

  const leftAllocResult = regs.tryResolveIrArg({
    size: argSize,
    arg: instruction.leftVar,
    allow: IRArgDynamicResolverType.MEM | IRArgDynamicResolverType.REG,
  });

  const rightAllocResult = regs.tryResolveIrArg({
    size: argSize,
    arg: instruction.rightVar,
    allow: IRArgDynamicResolverType.REG | IRArgDynamicResolverType.NUMBER,
  });

  const asm: string[] = [
    ...leftAllocResult.asm,
    ...rightAllocResult.asm,
    withInlineComment(
      genInstruction('cmp', leftAllocResult.value, rightAllocResult.value),
      instruction.getDisplayName(),
    ),
  ];

  const isUnsigned =
    isPrimitiveLikeType(instruction.leftVar.type, true) &&
    instruction.leftVar.type.isUnsigned();

  const [ifTrueInstruction, ifFalseInstruction] =
    OPERATOR_JMP_INSTRUCTIONS[operator][isUnsigned ? 'unsigned' : 'signed'];

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
