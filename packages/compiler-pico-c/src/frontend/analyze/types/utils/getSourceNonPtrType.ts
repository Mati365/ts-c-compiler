import { isArrayLikeType } from '../CArrayType';
import { isPointerLikeType } from '../CPointerType';
import type { CType } from '../CType';

/**
 * Extracts:
 *
 * - int from int**
 * - int from int[4][4]
 * - int from int
 */
export function getSourceNonPtrType(type: CType): CType {
  if (isPointerLikeType(type)) {
    return getSourceNonPtrType(type.baseType);
  }

  if (isArrayLikeType(type)) {
    return type.getFlattenInfo().type;
  }

  return type;
}
