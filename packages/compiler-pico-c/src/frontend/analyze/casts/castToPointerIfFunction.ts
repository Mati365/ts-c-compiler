import { CPointerType, CType, isFuncDeclLikeType } from '../types';

export function castToPointerIfFunction(type: CType) {
  if (!isFuncDeclLikeType(type)) {
    return type;
  }

  return CPointerType.ofType(type);
}
