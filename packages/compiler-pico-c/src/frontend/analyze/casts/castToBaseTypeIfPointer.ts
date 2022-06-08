import {CType, isPointerLikeType} from '../types';

export function castToBaseTypeIfPointer(type: CType) {
  if (!isPointerLikeType(type))
    return type;

  return type.baseType;
}
