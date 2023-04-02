import { CType } from '@compiler/pico-c/frontend/analyze';
import {
  getBaseTypeIfArray,
  getBaseTypeIfPtr,
} from '@compiler/pico-c/frontend/analyze/types/utils';

export function shouldEmitStringPtrInitializer(type: CType) {
  return getBaseTypeIfArray(getBaseTypeIfPtr(type)).isPointer();
}
