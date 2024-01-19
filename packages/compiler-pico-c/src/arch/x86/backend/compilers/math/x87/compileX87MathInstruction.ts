import { TokenType } from '@ts-c-compiler/lexer';

import { genInstruction } from 'arch/x86/asm-utils';
import { X86CompilerInstructionFnAttrs } from 'arch/x86/constants/types';

import { IRMathInstruction } from 'frontend/ir/instructions';
import { X86CompileInstructionOutput } from '../../shared';
import { CMathOperator } from '#constants';
import { isX87IRArgMemResult } from 'arch/x86/backend/reg-allocator';

const BinaryOperatorX87Opcode: Partial<Record<CMathOperator, string>> = {
  [TokenType.PLUS]: 'fadd',
  [TokenType.MINUS]: 'fsub',
  [TokenType.MUL]: 'fmul',
  [TokenType.DIV]: 'fdiv',
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

  const rightAllocResult = x87regs.tryResolveIrArgAsRegOrMem({
    arg: rightVar,
    castedType: outputVar.type,
  });

  const leftAllocResult = x87regs.tryResolveIRArgAsReg({
    stackTop: true,
    arg: leftVar,
    castedType: outputVar.type,
  });

  output.appendGroups(rightAllocResult.asm, leftAllocResult.asm);

  if (isX87IRArgMemResult(rightAllocResult)) {
    output.appendInstructions(
      genInstruction(BinaryOperatorX87Opcode[operator], rightAllocResult.value),
    );

    x87regs.tracker.setOwnership({
      reg: 'st0',
      size: outputVar.type.getByteSize(),
      varName: outputVar.name,
    });
  } else {
    output.appendInstructions(
      genInstruction(
        BinaryOperatorX87Opcode[operator],
        'st0',
        rightAllocResult.value,
      ),
    );

    x87regs.tracker.setOwnership({
      ...leftAllocResult.entry,
      varName: outputVar.name,
    });
  }

  output.appendGroup(x87regs.tracker.vacuumNotUsed());
  return output;
}
