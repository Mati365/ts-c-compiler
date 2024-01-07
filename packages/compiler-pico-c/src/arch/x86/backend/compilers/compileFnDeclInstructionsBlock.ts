import { IROpcode } from 'frontend/ir/constants';
import {
  IRCommentInstruction,
  IRFnDeclInstruction,
  isIRLabelInstruction,
} from 'frontend/ir/instructions';

import { X86StackFrameContentFn } from '../X86Allocator';
import { X86CompilerFnAttrs } from '../../constants/types';
import { X86CompileInstructionOutput } from './shared';

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
import { compileAsmInstruction } from './asm';
import {
  compileIntMathSingleInstruction,
  compileMathInstruction,
} from './math';

type FnDeclCompilerBlockFnAttrs = X86CompilerFnAttrs & {
  instruction: IRFnDeclInstruction;
};

export function compileFnDeclInstructionsBlock({
  instruction: fnInstruction,
  context,
}: FnDeclCompilerBlockFnAttrs) {
  const { allocator, iterator, labelsResolver } = context;

  const compileFnContent: X86StackFrameContentFn = () => {
    const fnOutput = new X86CompileInstructionOutput();

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
          fnOutput.appendGroup(compileAssignInstruction(arg));
          break;

        case IROpcode.PHI:
          compilePhiInstruction(arg);
          break;

        case IROpcode.LOAD:
          fnOutput.appendGroup(compileLoadInstruction(arg));
          break;

        case IROpcode.LEA:
          fnOutput.appendGroup(compileLeaInstruction(arg));
          break;

        case IROpcode.MATH_SINGLE:
          fnOutput.appendGroup(compileIntMathSingleInstruction(arg));
          break;

        case IROpcode.MATH:
          fnOutput.appendGroup(compileMathInstruction(arg));
          break;

        case IROpcode.ASM:
          fnOutput.appendGroup(compileAsmInstruction(arg));
          break;

        case IROpcode.STORE:
          fnOutput.appendGroup(compileStoreInstruction(arg));
          break;

        case IROpcode.JMP:
          fnOutput.appendGroup(compileJmpInstruction(arg));
          break;

        case IROpcode.CALL:
          fnOutput.appendGroup(compileCallInstruction(arg));
          break;

        case IROpcode.LABEL:
          fnOutput.appendGroup(compileLabelInstruction(arg));
          break;

        case IROpcode.LABEL_OFFSET:
          compileLabelOffsetInstruction(arg);
          break;

        case IROpcode.ICMP:
          fnOutput.appendGroup(compileICmpInstruction(arg));
          break;

        case IROpcode.COMMENT:
          fnOutput.asm.push(
            genComment((<IRCommentInstruction>instruction).comment),
          );
          break;

        case IROpcode.RET:
          fnOutput.appendGroup(
            compileRetInstruction({
              ...arg,
              fnInstruction,
            }),
          );
          break;
      }
    });

    return fnOutput;
  };

  const { asmLabel } = labelsResolver.createAndPutLabel({
    name: fnInstruction.name,
    type: fnInstruction.type,
    instruction: fnInstruction,
  });

  return X86CompileInstructionOutput.ofInstructions([
    genComment(fnInstruction.getDisplayName()),
    genLabel(asmLabel, false),
    allocator.allocStackFrameInstructions(compileFnContent),
  ]);
}
