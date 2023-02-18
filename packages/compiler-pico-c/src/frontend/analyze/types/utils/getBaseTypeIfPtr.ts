import { isPointerLikeType } from '../CPointerType';
import type { CType } from '../CType';

export function getBaseTypeIfPtr(type: CType): CType {
  if (isPointerLikeType(type)) {
    return type.baseType;
  }

  return type;
}
