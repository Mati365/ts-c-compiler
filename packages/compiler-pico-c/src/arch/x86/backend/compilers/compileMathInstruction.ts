import {TokenType} from '@compiler/lexer/shared';
import {IRMathInstruction} from '@compiler/pico-c/frontend/ir/instructions';

import {IRArgResolverType} from '../X86AbstractRegAllocator';
import {CompilerFnAttrs} from '../../constants/types';
import {genInstruction, withInlineComment} from '../../asm-utils';

type MathInstructionCompilerAttrs = CompilerFnAttrs & {
  instruction: IRMathInstruction;
};

export function compileMathInstruction(
  {
    iterator,
    instruction,
    context,
  }: MathInstructionCompilerAttrs,
): string[] {
  const {allocator} = context;
  const {leftVar, rightVar} = instruction;

  const leftAllocResult = allocator.regs.resolveIRArg(
    {
      iterator,
      allow: IRArgResolverType.REG,
      arg: leftVar,
    },
  );

  const rightAllocResult = allocator.regs.resolveIRArg(
    {
      iterator,
      allow: IRArgResolverType.REG | IRArgResolverType.MEM,
      arg: rightVar,
    },
  );

  let asm = '';
  switch (instruction.operator) {
    case TokenType.PLUS:
      asm = genInstruction('add', leftAllocResult.value, rightAllocResult.value);
      break;

    case TokenType.MINUS:
      asm = genInstruction('sub', leftAllocResult.value, rightAllocResult.value);
      break;
  }

  return [
    ...leftAllocResult.asm,
    ...rightAllocResult.asm,
    withInlineComment(asm, instruction.getDisplayName()),
  ];
}
