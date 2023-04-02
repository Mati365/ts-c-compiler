import {
  CArrayType,
  CPointerType,
  CVariableInitializerTree,
} from '@compiler/pico-c/frontend/analyze';

import { IRLabel, IRVariable } from '@compiler/pico-c/frontend/ir/variables';

import {
  IRDefDataInstruction,
  IRLabelOffsetInstruction,
  IRLoadInstruction,
  IRStoreInstruction,
} from '../../../../instructions';

import {
  createBlankExprResult,
  type IREmitterContext,
  type IREmitterExpressionResult,
} from '../../types';

export type StringPtrInitializerLocalIREmitAttrs = {
  context: IREmitterContext;
  literal: string;
  preserveLengthTypeInfo?: boolean;
  initializerMeta?: {
    destVar?: IRVariable;
    offset?: number;
  };
};

/**
 * Variables such like this:
 *
 *  const char* HELLO_WORLD2 = "Hello world2!";
 *  const char* str1 = "Hello world!";
 */
export function emitStringLiteralPtrLocalInitializerIR({
  context,
  literal,
  initializerMeta = {},
  preserveLengthTypeInfo,
}: StringPtrInitializerLocalIREmitAttrs): IREmitterExpressionResult {
  const { allocator, config } = context;

  const result = createBlankExprResult();
  const type = CPointerType.ofStringLiteral(config.arch);

  const arrayPtrType = CPointerType.ofArray(<CArrayType>type);
  const dataType = preserveLengthTypeInfo
    ? CArrayType.ofFlattenDescriptor({
        type,
        dimensions: [literal.length],
      })
    : type;

  const constArrayVar = allocator.allocDataVariable(dataType);
  const dataLabel = IRLabel.ofName(constArrayVar.name);

  result.data.push(
    new IRDefDataInstruction(
      new CVariableInitializerTree(type, null, [literal]),
      constArrayVar,
    ),
  );

  const tmpOffsetAddressVar = allocator.allocTmpPointer(arrayPtrType);
  const tmpLoadAddressVar = allocator.allocTmpVariable(arrayPtrType);

  result.output = tmpLoadAddressVar;
  result.instructions.push(
    new IRLabelOffsetInstruction(dataLabel, tmpOffsetAddressVar),
    new IRLoadInstruction(tmpOffsetAddressVar, tmpLoadAddressVar),
  );

  if (initializerMeta.destVar) {
    result.instructions.push(
      new IRStoreInstruction(
        tmpLoadAddressVar,
        initializerMeta.destVar,
        initializerMeta.offset,
      ),
    );
  }

  return result;
}
