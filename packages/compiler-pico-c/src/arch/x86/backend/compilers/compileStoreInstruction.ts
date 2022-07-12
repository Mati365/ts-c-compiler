import {IRStoreInstruction} from '@compiler/pico-c/frontend/ir/instructions';
import {getByteSizeArgPrefixName} from '@x86-toolkit/assembler/parser/utils';
import {isIRConstant, isIRVariable} from '@compiler/pico-c/frontend/ir/variables';

import {CompilerFnAttrs} from '../../constants/types';
import {genInstruction, withInlineComment} from '../../asm-utils';

type StoreInstructionCompilerAttrs = CompilerFnAttrs & {
  instruction: IRStoreInstruction;
};

export function compileStoreInstruction(
  {
    instruction,
    context,
  }: StoreInstructionCompilerAttrs,
): string {
  const {allocator} = context;
  const {outputVar, value} = instruction;

  const stackFrame = allocator.getCurrentStackFrame();
  const prefix = getByteSizeArgPrefixName(value.type.getByteSize());
  const addr = stackFrame.genLocalVarStackRelAddress(outputVar.name);

  let storeInput: number | string = null;
  if (isIRConstant(value)) {
    storeInput = value.constant;
  } else if (isIRVariable(value)) {
    // todo: remove
    storeInput = 'ax';
  }

  return withInlineComment(
    genInstruction('mov', `${prefix.toLocaleLowerCase()} ${addr}`, storeInput),
    instruction.getDisplayName(),
  );
}
