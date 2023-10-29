import { CCompilerArch } from '../constants';
import { CArchDescriptor } from './types';

export * from './x86/asm-utils';
import * as X86_16 from './x86/modes/16bit/sizeofPrimitiveType';

const COMPILER_ARCH_DESCRIPTORS: Record<
  CCompilerArch,
  Readonly<CArchDescriptor>
> = {
  [CCompilerArch.X86_16]: {
    sizeofPrimitiveType: X86_16.sizeofPrimitiveType,
    regs: {
      integral: {
        maxRegSize: 2,
      },
    },
  },
};

export function getCompilerArchDescriptor(arch: CCompilerArch) {
  return COMPILER_ARCH_DESCRIPTORS[arch];
}
