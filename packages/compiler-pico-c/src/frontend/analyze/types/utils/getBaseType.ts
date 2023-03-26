import { isArrayLikeType } from '../CArrayType';
import { isPointerLikeType } from '../CPointerType';
import { CType } from '../CType';
import { getBaseTypeIfArray } from './getBaseTypeIfArray';

export function getBaseType(type: CType) {
  if (isArrayLikeType(type)) {
    return getBaseTypeIfArray(type.baseType);
  }

  if (isPointerLikeType(type)) {
    return type.baseType;
  }

  return type;
}
