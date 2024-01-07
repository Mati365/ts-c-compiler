import { TokenType } from '@ts-c-compiler/lexer';
import { X86CompilerInstructionFnAttrs } from 'arch/x86/constants/types';
import { IRMathInstruction } from 'frontend/ir/instructions';
import { X86CompileInstructionOutput } from '../../shared';

type MathInstructionCompilerAttrs =
  X86CompilerInstructionFnAttrs<IRMathInstruction>;

export function compileX87MathInstruction({
  instruction,
  context,
}: MathInstructionCompilerAttrs) {
  const {
    allocator: { x87regs },
  } = context;
  const { operator, leftVar, rightVar } = instruction;

  const output = new X86CompileInstructionOutput();

  switch (operator) {
    case TokenType.PLUS:
      {
        const leftAllocResult = x87regs.pushIRArgOnStack({
          arg: leftVar,
          onTopOfStack: true,
        });

        const rightAllocResult = x87regs.pushIRArgOnStack({
          arg: rightVar,
        });

        output.appendGroups(leftAllocResult.asm, rightAllocResult.asm);
      }
      break;

    default:
      throw new Error('Fixme');
  }

  return output;
}
