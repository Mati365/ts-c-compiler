import { CPrimitiveType } from '@compiler/pico-c/frontend/analyze';
import { IRStoreInstruction } from '@compiler/pico-c/frontend/ir/instructions';
import { IRConstant } from '@compiler/pico-c/frontend/ir/variables';

import { createBlankExprResult, type IREmitterStmtResult } from '../../types';
import { StringPtrInitializerLocalIREmitAttrs } from './emitStringLiteralPtrInitializerIR';

type StringBlobInitializerLocalIREmitAttrs = Omit<
  StringPtrInitializerLocalIREmitAttrs,
  'preserveLengthTypeInfo'
>;

export function emitStringLiteralBlobLocalInitializerIR({
  context,
  literal,
  initializerMeta,
}: StringBlobInitializerLocalIREmitAttrs): IREmitterStmtResult {
  const { config } = context;
  const { destVar, offset } = initializerMeta;

  const result = createBlankExprResult();
  const charType = CPrimitiveType.char(config.arch);

  for (let i = 0; i < literal.length; ++i) {
    const char = literal.charCodeAt(i);

    result.instructions.push(
      new IRStoreInstruction(
        IRConstant.ofConstant(charType, char),
        destVar,
        offset + i,
      ),
    );
  }

  return result;
}
