import {CCompilerArch} from '@compiler/pico-c/constants';
import {CPointerType, CType, isArrayLikeType} from '../types';

export function castToPointerIfArray(arch: CCompilerArch, type: CType) {
  if (!isArrayLikeType(type))
    return type;

  return CPointerType.ofType(arch, type.getBaseType());
}
