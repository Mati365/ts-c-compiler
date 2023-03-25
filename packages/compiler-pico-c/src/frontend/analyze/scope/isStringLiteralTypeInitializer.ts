import { CCompilerArch } from '@compiler/pico-c/constants';

import type { CVariableInitializerTree } from '.';

import { checkLeftTypeOverlapping } from '@compiler/pico-c/frontend/analyze/checker/checkLeftTypeOverlapping';
import {
  CArrayType,
  isArrayLikeType,
  isPointerLikeType,
  type CType,
} from '../types';

type StringInitializerCheckAttrs = {
  type: CType;
  initializer: CVariableInitializerTree;
  arch: CCompilerArch;
};

export function isStringLiteralTypeInitializer({
  type,
  arch,
  initializer,
}: StringInitializerCheckAttrs) {
  const isArrayType = isArrayLikeType(type);
  const isStringPtr =
    isPointerLikeType(type) &&
    checkLeftTypeOverlapping(type, CArrayType.ofStringLiteral(arch), {
      implicitCast: false,
      ignoreConstChecks: true,
    });

  return (
    (isStringPtr || isArrayType) &&
    (!isArrayType || type.getSourceType().isConst()) &&
    initializer.hasOnlyConstantExpressions() &&
    initializer.getInitializedFieldsCount() > (isStringPtr ? 1 : 3)
  );
}
