import { IROpcode } from 'frontend/ir/constants';
import {
  IRCommentInstruction,
  IRFnDeclInstruction,
  isIRLabelInstruction,
} from 'frontend/ir/instructions';

import { X86StackFrameContentFn } from '../X86Allocator';
import {
  X86CompiledBlockOutput,
  X86CompilerFnAttrs,
} from '../../constants/types';

import { genComment, genLabel } from '../../asm-utils';
import { getX86FnCaller } from '../call-conventions';

import { compileAllocInstruction } from './compileAllocInstruction';
import { compileStoreInstruction } from './compileStoreInstruction';
import { compileLoadInstruction } from './compileLoadInstruction';
import { compileICmpInstruction } from './compileICmpInstruction';
import { compileLabelInstruction } from './compileLabelInstruction';
import { compileJmpInstruction } from './compileJmpInstruction';
import { compileLeaInstruction } from './compileLeaInstruction';
import { compileAssignInstruction } from './compileAssignInstruction';
import { compilePhiInstruction } from './compilePhiInstruction';
import { compileRetInstruction } from './compileRetInstruction';
import { compileLabelOffsetInstruction } from './compileLabelOffsetInstruction';
import { compileCallInstruction } from './compileCallInstruction';
import { compileMathSingleInstruction, compileMathInstruction } from './math';
import { compileAsmInstruction } from './asm';

type FnDeclCompilerBlockFnAttrs = X86CompilerFnAttrs & {
  instruction: IRFnDeclInstruction;
};

export function compileFnDeclInstructionsBlock({
  instruction: fnInstruction,
  context,
}: FnDeclCompilerBlockFnAttrs): X86CompiledBlockOutput {
  const { allocator, iterator, labelsResolver } = context;

  const compileFnContent: X86StackFrameContentFn = () => {
    const asm: string[] = [];

    getX86FnCaller(fnInstruction.type.callConvention).allocIRFnDefArgs({
      declInstruction: fnInstruction,
      context,
    });

    iterator.walk(instruction => {
      const arg = {
        instruction: <any>instruction,
        context,
        iterator,
      };

      if (isIRLabelInstruction(instruction)) {
        allocator.regs.ownership.releaseAllRegs();
      }

      switch (instruction.opcode) {
        case IROpcode.ALLOC:
          compileAllocInstruction(arg);
          break;

        case IROpcode.ASSIGN:
          asm.push(...compileAssignInstruction(arg));
          break;

        case IROpcode.PHI:
          compilePhiInstruction(arg);
          break;

        case IROpcode.LOAD:
          asm.push(...compileLoadInstruction(arg));
          break;

        case IROpcode.LEA:
          asm.push(...compileLeaInstruction(arg));
          break;

        case IROpcode.MATH_SINGLE:
          asm.push(...compileMathSingleInstruction(arg));
          break;

        case IROpcode.MATH:
          asm.push(...compileMathInstruction(arg));
          break;

        case IROpcode.ASM:
          asm.push(...compileAsmInstruction(arg));
          break;

        case IROpcode.STORE:
          asm.push(...compileStoreInstruction(arg));
          break;

        case IROpcode.JMP:
          asm.push(...compileJmpInstruction(arg));
          break;

        case IROpcode.CALL:
          asm.push(...compileCallInstruction(arg));
          break;

        case IROpcode.LABEL:
          asm.push(...compileLabelInstruction(arg));
          break;

        case IROpcode.LABEL_OFFSET:
          compileLabelOffsetInstruction(arg);
          break;

        case IROpcode.ICMP:
          asm.push(...compileICmpInstruction(arg));
          break;

        case IROpcode.COMMENT:
          asm.push(genComment((<IRCommentInstruction>instruction).comment));
          break;

        case IROpcode.RET:
          asm.push(
            ...compileRetInstruction({
              ...arg,
              fnInstruction,
            }),
          );
          break;
      }
    });

    return {
      asm,
    };
  };

  const { asmLabel } = labelsResolver.createAndPutLabel({
    name: fnInstruction.name,
    type: fnInstruction.type,
    instruction: fnInstruction,
  });

  const asm = [
    genComment(fnInstruction.getDisplayName()),
    genLabel(asmLabel, false),
    ...allocator.allocStackFrameInstructions(compileFnContent),
  ];

  return {
    asm,
  };
}
