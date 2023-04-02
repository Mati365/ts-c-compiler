import { CCompilerArch } from '@compiler/pico-c/constants';

import { checkLeftTypeOverlapping } from '@compiler/pico-c/frontend/analyze/checker/checkLeftTypeOverlapping';
import type { CVariableInitializerTree } from '../../analyze';
import {
  isArrayLikeType,
  isPointerLikeType,
  CArrayType,
  type CType,
} from '../../analyze/types';

type VirtualArrayPtrInitializerCheckAttrs = {
  type: CType;
  initializer: CVariableInitializerTree;
  arch: CCompilerArch;
};

export function checkIfVirtualLocalArrayPtr({
  type,
  arch,
  initializer,
}: VirtualArrayPtrInitializerCheckAttrs) {
  const isArrayType = isArrayLikeType(type);
  const isStringPtr =
    isPointerLikeType(type) &&
    checkLeftTypeOverlapping(type, CArrayType.ofStringLiteral(arch), {
      implicitCast: false,
      ignoreConstChecks: true,
    });

  return (
    (!isStringPtr || isArrayType) &&
    (!isArrayType || type.getSourceType().isConst()) &&
    initializer.hasOnlyConstantExpressions() &&
    initializer.getFlattenNonLiteralScalarFieldsCount() > (isStringPtr ? 1 : 3)
  );
}
