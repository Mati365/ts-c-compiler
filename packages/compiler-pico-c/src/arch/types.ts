import {SizeofPrimitiveTypeFn} from './utils';

export type CArchRegsInfo = {
  integral: {
    maxRegSize: number,
  };
};

export type CArchDescriptor = {
  sizeofPrimitiveType: SizeofPrimitiveTypeFn;
  regs: CArchRegsInfo;
};
