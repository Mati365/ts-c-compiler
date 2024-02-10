import { CType } from 'frontend/analyze';
import { getBaseTypeIfArray, getBaseTypeIfPtr } from 'frontend/analyze/types/utils';

export function shouldEmitStringPtrInitializer(type: CType) {
  return getBaseTypeIfArray(getBaseTypeIfPtr(type)).isPointer();
}
