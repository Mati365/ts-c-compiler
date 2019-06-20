import * as R from 'ramda';

/**
 * @see
 * http://www.mathemainzel.info/files/x86asmref.html
 */
export class Instruction {
  constructor(mnemonic, binarySchema, signBit, modeSizeBit, minLen, maxLen, affectedFlags) {
    this.mnemonic = mnemonic;
    this.binarySchema = binarySchema;
    this.signBit = signBit;
    this.modeSizeBit = modeSizeBit;
    this.minLen = minLen;
    this.maxLen = maxLen;
    this.affectedFlags = affectedFlags;
  }
}

const mapIndexedInstructions = R.mapObjIndexed(
  (instructionList, instructionName) => {
    if (!R.is(Array, instructionList))
      instructionList = [instructionList];

    return R.map(
      args => new Instruction(instructionName, ...args),
      instructionList,
    );
  },
);

export default mapIndexedInstructions({
  mov: [
    ['al, rmb', 'a0 d0 d1', null, 'b', 3, 3, '--------'],
    ['ax, rmw', 'a1 d0 d1', null, 'w', 3, 3, '--------'],
    ['al, ib', 'b0 i0', null, 'b', 2, 2, '--------'],
    ['ah, ib', 'b4 i0', null, 'b', 2, 2, '--------'],
    ['ax, iw', 'b8 i0 i1', null, 'w', 3, 3, '--------'],
    ['cl, ib', 'b1 i0', null, 'b', 2, 2, '--------'],
    ['ch, ib', 'b5 i0', null, 'b', 2, 2, '--------'],
    ['cx, iw', 'b9 i0 i1', null, 'w', 3, 3, '--------'],
    // MOV     DL,ib  B2 i0   B  2  --------
    // MOV     DH,ib  B6 i0   B  2  --------
    // MOV     DX,iw  BA i0 i1   W  3  --------
    // MOV     BL,ib  B3 i0   B  2  --------
    // MOV     BH,ib  B7 i0   B  2  --------
    // MOV     BX,iw  BB i0 i1   W  3  --------
    // MOV     SP,iw  BC i0 i1   W  3  --------
    // MOV     BP,iw  BD i0 i1   W  3  --------
    // MOV     SI,iw  BE i0 i1   W  3  --------
    // MOV     DI,iw  BF i0 i1   W  3  --------
    // MOV     cr,rd       [386]  0F 22 mr     3  --------
    // MOV     rd,cr       [386]  0F 20 mr     3  --------
    // MOV     dr,rd       [386]  0F 23 mr     3  --------
    // MOV     rd,dr       [386]  0F 21 mr     3  --------
    // MOV     tr,rd       [386]  0F 26 mr     2  --------
    // MOV     rd,tr       [386]  0F 24 mr     3  --------
    // MOV     rb,rmb  8A mr d0 d1   B  2~4  --------
    // MOV     rmb,rb  88 mr d0 d1   B  2~4  --------
    // MOV     rmb,AL  A2 d0 d1   B  3  --------
    // MOV     rmw,AX  A3 d0 d1   W  3  --------
    // MOV     rmb,ib  C6 mr d0 d1 i0   B  3~5  --------
    // MOV     rmw,iw  C7 mr d0 d1 i0 i1   W  4~6  --------
    // MOV     rmw,rw  89 mr d0 d1   W  2~4  --------
    // MOV     rw,rmw  8B mr d0 d1   W  2~4  --------
    // MOV     rmw,sr  8C mr d0 d1     2~4  --------
    // MOV     sr,rmw  8E mr d0 d1     2~4  --------
  ],
});
