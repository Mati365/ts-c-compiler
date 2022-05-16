import {CType} from '../types/CType';
import {
  isPointerLikeType,
  isArrayLikeType,
  isPrimitiveLikeType,
} from '../types';

/**
 *Check if right type can be assigned to left type
 *
 * @see
 *  Instead of isEqual() it performs also implict casts!
 *
 * @example
 *  const char* cannot be assigned to char*
 *  but char* to const char* can be
 *
 * @export
 * @param {CType} left
 * @param {CType} right
 * @param {boolean} [implicitCast=true]
 * @return {*}  {boolean}
 */
export function checkLeftTypeOverlapping(
  left: CType,
  right: CType,
  implicitCast: boolean = true,
): boolean {
  if (!left || !right)
    return false;

  if (left.isEqual(right))
    return true;

  if (left.isConst() && !right.isConst()) {
    return checkLeftTypeOverlapping(
      left.ofNonConstQualifiers(),
      right.ofNonConstQualifiers(),
      implicitCast,
    );
  }

  // [left] char* = [right] char[4] is being transformed to char and char
  // in C array is actually pointer
  if (isPointerLikeType(left)) {
    if (isPointerLikeType(right) || isArrayLikeType(right))
      return checkLeftTypeOverlapping(left.baseType, right.baseType, implicitCast);
  }

  // [left ]char[4] = [right] char*
  if (isArrayLikeType(left)) {
    if (isArrayLikeType(right)) {
      if (!left.isUnknownSize() && left.size !== right.size)
        return false;

      return checkLeftTypeOverlapping(left.baseType, right.baseType, implicitCast);
    }

    if (isPointerLikeType(right))
      return checkLeftTypeOverlapping(left.baseType, right.baseType, implicitCast);
  }

  if (implicitCast) {
    const leftPrimitive = isPrimitiveLikeType(left);
    const rightPrimitive = isPrimitiveLikeType(right);

    // primitive types in C can be implict casted
    if (leftPrimitive && rightPrimitive)
      return true;

    // implict cast number to pointer
    if ((isPointerLikeType(left) && rightPrimitive && right.isIntegral())
        || (isPointerLikeType(right) && leftPrimitive && left.isIntegral()))
      return true;
  }

  return false;
}
