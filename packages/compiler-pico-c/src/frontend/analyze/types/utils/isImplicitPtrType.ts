import {CType} from '../CType';
import {isArrayLikeType} from '../CArrayType';
import {isFuncDeclLikeType} from '../function';

export function isImplicitPtrType(type: CType) {
  return isArrayLikeType(type) || isFuncDeclLikeType(type);
}
