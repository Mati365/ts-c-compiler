import { CCompilerArch } from '@compiler/pico-c/constants';
import { CType, CTypeDescriptor } from './CType';

export enum CFlag {
  ZF = 'zf',
}

export type CFlagTypeDescriptor = CTypeDescriptor & {
  flag: CFlag;
};

/**
 * Type that stores CPU flag result
 */
export class CFlagType extends CType<CFlagTypeDescriptor> {
  static ofBlank(arch: CCompilerArch, flag: CFlag) {
    return new CFlagType({
      arch,
      flag,
    });
  }

  get flag() {
    return this.value.flag;
  }

  override isFlag() {
    return true;
  }

  override getByteSize(): number {
    return null;
  }

  getDisplayName(): string {
    const { flag } = this;

    return `i1:${flag}`;
  }
}
