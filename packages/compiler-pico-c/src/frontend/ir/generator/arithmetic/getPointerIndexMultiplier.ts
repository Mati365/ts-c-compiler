import {CPointerType} from '@compiler/pico-c/frontend/analyze';

/**
 * @see
 *  (a_pointer + (a_number * sizeof(*a_pointer)))
 */
export function getPointerIndexMultiplier(type: CPointerType) {
  return type.baseType.getByteSize();
}
