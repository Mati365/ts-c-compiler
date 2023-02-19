import { CStructType } from '@compiler/pico-c/frontend/analyze';
import { IRAllocInstruction, IRLeaInstruction } from '../../../instructions';
import { IRVariableAllocator } from '../../IRVariableAllocator';
import {
  createBlankExprResult,
  type IREmitterExpressionResult,
} from '../types';

type ShallowCopyIRAttrs = {
  type: CStructType;
  allocator: IRVariableAllocator;
};

export function emitStructShallowCopyIR({
  type,
  allocator,
}: ShallowCopyIRAttrs): IREmitterExpressionResult {
  const result = createBlankExprResult();
  const structAllocVar = allocator.allocTmpPointer(type);
  const structPtrVar = allocator.allocTmpPointer(structAllocVar.type);

  result.output = structPtrVar;
  result.instructions.push(
    new IRAllocInstruction(type, structAllocVar),
    new IRLeaInstruction(structAllocVar, structPtrVar),
  );

  setTimeout(() => {
    console.info('xDD', type.getDisplayName());
  });

  return result;
}
