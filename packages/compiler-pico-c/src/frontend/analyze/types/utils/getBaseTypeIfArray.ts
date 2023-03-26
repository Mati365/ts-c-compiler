import { isArrayLikeType } from '../CArrayType';
import type { CType } from '../CType';

export function getBaseTypeIfArray(type: CType): CType {
  if (isArrayLikeType(type)) {
    return getBaseTypeIfArray(type.baseType);
  }

  return type;
}
