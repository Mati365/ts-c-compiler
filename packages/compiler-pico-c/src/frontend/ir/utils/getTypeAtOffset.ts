import {
  getBaseTypeIfPtr,
  getSourceNonPtrType,
} from '@compiler/pico-c/frontend/analyze/types/utils';

import {
  CType,
  isArrayLikeType,
  isStructLikeType,
} from '@compiler/pico-c/frontend/analyze';

export const getTypeAtOffset = (type: CType, offset: number): CType => {
  const baseOutputType = getBaseTypeIfPtr(type);

  if (isStructLikeType(baseOutputType)) {
    return baseOutputType.getFlattenFieldTypeByOffset(offset);
  }

  if (isArrayLikeType(baseOutputType)) {
    const arrayItem = getSourceNonPtrType(baseOutputType);

    return getTypeAtOffset(arrayItem, offset % arrayItem.getByteSize());
  }

  return baseOutputType;
};
