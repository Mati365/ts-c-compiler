import { CType } from 'frontend/analyze';
import { getTypeAtOffset } from './getTypeAtOffset';

export const getTypeOffsetByteSize = (type: CType, offset: number) => {
  return getTypeAtOffset(type, offset).getByteSize();
};
