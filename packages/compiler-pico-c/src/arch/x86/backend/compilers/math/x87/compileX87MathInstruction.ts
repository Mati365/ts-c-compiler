import { TokenType } from '@ts-c-compiler/lexer';

import { genInstruction } from 'arch/x86/asm-utils';
import { X86CompilerInstructionFnAttrs } from 'arch/x86/constants/types';

import { IRMathInstruction } from 'frontend/ir/instructions';
import { X86CompileInstructionOutput } from '../../shared';
import { CMathOperator } from '#constants';

const BinaryOperatorX87Opcode: Partial<Record<CMathOperator, string>> = {
  [TokenType.PLUS]: 'faddp',
  [TokenType.MINUS]: 'fsubp',
  [TokenType.MUL]: 'fmulp',
  [TokenType.DIV]: 'fdivp',
};

type MathInstructionCompilerAttrs =
  X86CompilerInstructionFnAttrs<IRMathInstruction>;

export function compileX87MathInstruction({
  instruction,
  context,
}: MathInstructionCompilerAttrs) {
  const {
    allocator: { x87regs },
  } = context;

  const { operator, leftVar, rightVar, outputVar } = instruction;
  const output = new X86CompileInstructionOutput();

  const rightAllocResult = x87regs.pushIRArgOnStack({
    arg: rightVar,
    castedType: outputVar.type,
  });

  const leftAllocResult = x87regs.pushIRArgOnStack({
    arg: leftVar,
    castedType: outputVar.type,
  });

  output.appendGroups(rightAllocResult.asm, leftAllocResult.asm);
  output.appendInstructions(
    genInstruction(
      BinaryOperatorX87Opcode[operator],
      rightAllocResult.entry.reg,
      leftAllocResult.entry.reg,
    ),
  );

  const outputPushResult = x87regs.tracker.push({
    reg: 'st0',
    varName: outputVar.name,
    size: outputVar.type.getByteSize(),
  });

  output.appendGroup(outputPushResult);
  return output;
}
