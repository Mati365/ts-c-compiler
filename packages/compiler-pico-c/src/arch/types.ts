export type SizeofPrimitiveTypeFn = (specifiers: number) => number;

export type CArchRegsInfo = {
  integral: {
    maxRegSize: number,
  };
};

export type CArchDescriptor = {
  sizeofPrimitiveType: SizeofPrimitiveTypeFn;
  regs: CArchRegsInfo;
};
