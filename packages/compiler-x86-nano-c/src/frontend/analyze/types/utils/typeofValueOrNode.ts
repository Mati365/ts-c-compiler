import {isCompilerTreeNode} from '@compiler/x86-nano-c/frontend/parser';
import {CCompilerArch} from '@compiler/x86-nano-c/constants';

import {CPrimitiveType} from '../CPrimitiveType';
import {CType} from '../CType';

export function typeofValueOrNode(arch: CCompilerArch, value: any): CType {
  if (isCompilerTreeNode(value))
    return value.type;

  return CPrimitiveType.typeofValue(arch, value);
}
