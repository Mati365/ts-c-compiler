import { isArrayLikeType } from '../CArrayType';
import type { CType } from '../CType';

export function getSourceNonArrayType(type: CType): CType {
  if (isArrayLikeType(type)) {
    return type.getFlattenInfo().type;
  }

  return type;
}
