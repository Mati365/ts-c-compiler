import {
  getBaseTypeIfPtr,
  getSourceNonArrayType,
} from '@compiler/pico-c/frontend/analyze/types/utils';

import {
  CType,
  isArrayLikeType,
  isStructLikeType,
} from '@compiler/pico-c/frontend/analyze';

export const getTypeAtOffset = (
  type: CType,
  offset: number,
  unwrapPtr: boolean = true,
): CType => {
  const baseOutputType = unwrapPtr ? getBaseTypeIfPtr(type) : type;

  if (isStructLikeType(baseOutputType)) {
    return baseOutputType.getFlattenFieldTypeByOffset(offset);
  }

  if (isArrayLikeType(baseOutputType)) {
    const arrayItem = getSourceNonArrayType(baseOutputType);

    return getTypeAtOffset(arrayItem, offset % arrayItem.getByteSize(), false);
  }

  return baseOutputType;
};
