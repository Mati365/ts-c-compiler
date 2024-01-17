import { getBiggerIRArg } from 'frontend/ir/utils';
import { isPrimitiveLikeType } from 'frontend/analyze';

import { CRelOperator } from '#constants';
import { TokenType } from '@ts-c-compiler/lexer';
import { CBackendError, CBackendErrorCode } from 'backend/errors/CBackendError';

import { IRICmpInstruction, isIRBrInstruction } from 'frontend/ir/instructions';

import {
  genInstruction,
  genLabelName,
  withInlineComment,
} from '../../asm-utils';

import { IRArgDynamicResolverType } from '../reg-allocator';
import { X86CompilerInstructionFnAttrs } from '../../constants/types';
import { X86CompileInstructionOutput } from './shared';

const INT_OPERATOR_JMP_INSTRUCTIONS: Record<
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
}: ICmpInstructionCompilerAttrs) {
  const {
    iterator,
    allocator: { regs, x87regs },
  } = context;

  const { operator, leftVar, rightVar } = instruction;
  const brInstruction = iterator.next();
  const output = new X86CompileInstructionOutput();

  if (!isIRBrInstruction(brInstruction)) {
    throw new CBackendError(CBackendErrorCode.MISSING_BR_INSTRUCTION);
  }

  if (
    isPrimitiveLikeType(leftVar.type, true) &&
    isPrimitiveLikeType(rightVar.type, true) &&
    (leftVar.type.isFloating() || rightVar.type.isFloating())
  ) {
    // compare float values
    // if (a: float > b: float)
    const flagReg = regs.requestReg({ size: 2, allowedRegs: ['ax'] });

    output.appendInstructions(...flagReg.asm);

    // some instructions use inverted stack order
    if (
      operator === TokenType.LESS_THAN ||
      operator === TokenType.LESS_EQ_THAN
    ) {
      const leftAllocResult = x87regs.tryResolveIRArgAsReg({
        arg: leftVar,
        castedType: leftVar.type,
      });

      const rightAllocResult = x87regs.tryResolveIRArgAsReg({
        arg: rightVar,
        castedType: leftVar.type,
        stackTop: true,
      });

      output.appendGroups(leftAllocResult.asm, rightAllocResult.asm);
      output.appendInstructions(
        genInstruction('fucom', leftAllocResult.entry.reg),
      );
    } else {
      const rightAllocResult = x87regs.tryResolveIRArgAsReg({
        arg: rightVar,
        castedType: leftVar.type,
      });

      const leftAllocResult = x87regs.tryResolveIRArgAsReg({
        arg: leftVar,
        castedType: leftVar.type,
        stackTop: true,
      });

      output.appendGroups(rightAllocResult.asm, leftAllocResult.asm);
      output.appendInstructions(
        genInstruction('fucom', rightAllocResult.entry.reg),
      );
    }

    output.appendInstructions(genInstruction('fnstsw', flagReg.value));

    let jmpInstruction: Record<'ifTrue' | 'ifFalse', string> = {
      ifTrue: 'je',
      ifFalse: 'jne',
    };

    switch (operator) {
      case TokenType.DIFFERS:
        output.appendInstructions(
          genInstruction('and', 'ah', 0x45),
          genInstruction('cmp', 'ah', 0x40),
        );

        jmpInstruction = {
          ifTrue: 'jne',
          ifFalse: 'je',
        };
        break;

      case TokenType.EQUAL:
        output.appendInstructions(
          genInstruction('and', 'ah', 0x45),
          genInstruction('xor', 'ah', 0x40),
        );
        break;

      case TokenType.LESS_EQ_THAN:
      case TokenType.GREATER_EQ_THAN:
        output.appendInstructions(genInstruction('test', 'ah', 0x5));
        break;

      case TokenType.LESS_THAN:
      case TokenType.GREATER_THAN:
        output.appendInstructions(genInstruction('test', 'ah', 0x45));
        break;

      default: {
        const unknown: never = operator;

        throw new CBackendError(CBackendErrorCode.UNKNOWN_X87_OPERATOR, {
          operator: unknown,
        });
      }
    }

    regs.releaseRegs([flagReg.value]);

    if (brInstruction.ifTrue) {
      output.appendInstructions(
        withInlineComment(
          genInstruction(
            jmpInstruction.ifTrue,
            genLabelName(brInstruction.ifTrue.name),
          ),
          brInstruction.getDisplayName(),
        ),
      );
    }

    if (brInstruction.ifFalse) {
      output.appendInstructions(
        withInlineComment(
          genInstruction(
            jmpInstruction.ifFalse,
            genLabelName(brInstruction.ifFalse.name),
          ),
          brInstruction.getDisplayName(),
        ),
      );
    }
  } else {
    // handle case when we compare int with char like this:
    // if (a: int > b: char) { ... }
    const argSize = getBiggerIRArg(leftVar, rightVar).type.getByteSize();

    const leftAllocResult = regs.tryResolveIrArg({
      size: argSize,
      arg: leftVar,
      allow: IRArgDynamicResolverType.MEM | IRArgDynamicResolverType.REG,
    });

    const rightAllocResult = regs.tryResolveIrArg({
      size: argSize,
      arg: rightVar,
      allow: IRArgDynamicResolverType.REG | IRArgDynamicResolverType.NUMBER,
    });

    output.appendInstructions(
      ...leftAllocResult.asm,
      ...rightAllocResult.asm,
      withInlineComment(
        genInstruction('cmp', leftAllocResult.value, rightAllocResult.value),
        instruction.getDisplayName(),
      ),
    );

    const isUnsigned =
      isPrimitiveLikeType(leftVar.type, true) && leftVar.type.isUnsigned();

    const [ifTrueInstruction, ifFalseInstruction] =
      INT_OPERATOR_JMP_INSTRUCTIONS[operator][
        isUnsigned ? 'unsigned' : 'signed'
      ];

    if (brInstruction.ifTrue) {
      output.appendInstructions(
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
      output.appendInstructions(
        withInlineComment(
          genInstruction(
            ifFalseInstruction,
            genLabelName(brInstruction.ifFalse.name),
          ),
          brInstruction.getDisplayName(),
        ),
      );
    }
  }

  if (output.isEmpty()) {
    throw new CBackendError(CBackendErrorCode.UNABLE_TO_COMPILE_INSTRUCTION);
  }

  return output;
}
