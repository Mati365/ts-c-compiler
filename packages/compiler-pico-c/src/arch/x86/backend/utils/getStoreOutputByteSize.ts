import {
  getBaseTypeIfPtr,
  getSourceNonPtrType,
} from '@compiler/pico-c/frontend/analyze/types/utils';

import {
  CType,
  isArrayLikeType,
  isStructLikeType,
} from '@compiler/pico-c/frontend/analyze';

export const getStoreOutputByteSize = (type: CType, offset: number) => {
  const baseOutputType = getBaseTypeIfPtr(type);

  if (isStructLikeType(baseOutputType)) {
    return baseOutputType.getFlattenFieldTypeByOffset(offset).getByteSize();
  }

  if (isArrayLikeType(baseOutputType)) {
    const arrayItem = getSourceNonPtrType(baseOutputType);

    return getStoreOutputByteSize(arrayItem, offset % arrayItem.getByteSize());
  }

  return baseOutputType.getByteSize();
};
