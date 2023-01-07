import type { CType } from '../types';

import { castToPointerIfArray } from './castToPointerIfArray';
import { castToPointerIfFunction } from './castToPointerIfFunction';

export function tryCastToPointer(type: CType) {
  return castToPointerIfArray(castToPointerIfFunction(type));
}
