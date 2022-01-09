import {CType} from '../types/CType';
import {
  isPointerLikeType,
  isArrayLikeType,
} from '../types';

/**
 * Check if right type can be assigned to left type
 *
 * @see
 *  Instead of isEqual() it performs also const casts!
 *
 * @example
 *  const char* cannot be assigned to char*
 *  but char* to const char* can be
 *
 * @export
 * @param {CType} left
 * @param {CType} right
 * @return {boolean}
 */
export function checkLeftTypeOverlapping(left: CType, right: CType): boolean {
  if (!left || !right)
    return false;

  if (left.isEqual(right))
    return true;

  if (left.isConst() && !right.isConst()) {
    return checkLeftTypeOverlapping(
      left.ofNonConstQualifiers(),
      right.ofNonConstQualifiers(),
    );
  }

  // [left] char* = [right] char[4] is being transformed to char and char
  // in C array is actually pointer
  if (isPointerLikeType(left)) {
    if (isPointerLikeType(right) || isArrayLikeType(right))
      return checkLeftTypeOverlapping(left.baseType, right.baseType);
  }

  // [left ]char[4] = [right] char*
  if (isArrayLikeType(left)) {
    if (isArrayLikeType(right)) {
      if (left.size !== right.size)
        return false;

      return checkLeftTypeOverlapping(left.baseType, right.baseType);
    }

    if (isPointerLikeType(right))
      return checkLeftTypeOverlapping(left.baseType, right.baseType);
  }

  return false;
}
