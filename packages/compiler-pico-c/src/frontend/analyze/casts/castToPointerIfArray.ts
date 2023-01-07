import { CPointerType, CType, isArrayLikeType } from '../types';

export function castToPointerIfArray(type: CType) {
  if (!isArrayLikeType(type)) {
    return type;
  }

  return CPointerType.ofType(type.getSourceType());
}
