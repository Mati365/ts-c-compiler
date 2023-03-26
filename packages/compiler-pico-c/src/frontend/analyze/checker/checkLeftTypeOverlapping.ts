import { CType } from '../types/CType';

import { isImplicitPtrType } from '../types/utils';
import {
  isPointerLikeType,
  isArrayLikeType,
  isPrimitiveLikeType,
} from '../types';

type CastOverlapCheck = {
  ignoreConstChecks?: boolean;
  implicitCast?: boolean;
};

/**
 *Check if right type can be assigned to left type
 *
 * @see
 *  Instead of isEqual() it performs also implict casts!
 *
 * @example
 *  const char* cannot be assigned to char*
 *  but char* to const char* can be
 */
export function checkLeftTypeOverlapping(
  left: CType,
  right: CType,
  attrs: CastOverlapCheck = {},
): boolean {
  const { ignoreConstChecks, implicitCast = true } = attrs;

  if (!left || !right) {
    return false;
  }

  if (left.isEqual(right)) {
    return true;
  }

  if (
    (left.isConst() && !right.isConst()) ||
    (ignoreConstChecks && (left.isConst() || right.isConst()))
  ) {
    return checkLeftTypeOverlapping(
      left.ofNonConstQualifiers(),
      right.ofNonConstQualifiers(),
      attrs,
    );
  }

  // [left] char* = [right] char[4] is being transformed to char and char
  // in C array is actually pointer
  if (isPointerLikeType(left)) {
    if (isImplicitPtrType(right)) {
      return true;
    }

    if (isPointerLikeType(right) || isArrayLikeType(right)) {
      return checkLeftTypeOverlapping(left.baseType, right.baseType, attrs);
    }
  }

  // [left ]char[4] = [right] char*
  if (isArrayLikeType(left)) {
    if (isArrayLikeType(right)) {
      if (!left.isUnknownSize() && left.size !== right.size) {
        return false;
      }

      return checkLeftTypeOverlapping(left.baseType, right.baseType, attrs);
    }

    if (isPointerLikeType(right)) {
      return checkLeftTypeOverlapping(left.baseType, right.baseType, attrs);
    }
  }

  if (implicitCast) {
    const leftPrimitive = isPrimitiveLikeType(left);
    const rightPrimitive = isPrimitiveLikeType(right);

    // primitive types in C can be implict casted
    if (
      leftPrimitive &&
      rightPrimitive &&
      !left.isPointer() &&
      !right.isPointer()
    ) {
      return true;
    }

    // implict cast number to pointer
    if (
      (isPointerLikeType(left) && rightPrimitive && right.isIntegral()) ||
      (isPointerLikeType(right) && leftPrimitive && left.isIntegral())
    ) {
      return true;
    }
  }

  return false;
}
