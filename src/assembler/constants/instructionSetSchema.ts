import * as R from 'ramda';
import {X86BitsMode} from '../../emulator/types';

/**
 * Mnemonic notation:
 * mb,mw,md,mq - memory byte, word, double word, quad word
 * rb, rw, rd - register byte, word, double word
 * rmb, rmw - register or memory byte, word
 * ib, iw - immediate byte, word
 * sl, ll - short label, long label
 * mwr, mdr, mqr, mtr - memory word, double word, quad word, ten byte
 *
 * Binary notation:
 * mr - addressing mode byte
 * d0 d1 - displacement
 * i0 i1 - immediate word
 * s0 s1 - short value
 * r0 - relative short displacement to label 'sl' (-128/+127 bytes)
 * r0 r1 - relative long displacement to label 'll' (-32768/+32767 bytes)
 */
export enum InstructionArgType {
  MEM,
  REGISTER,
  REGISTER_MEM,
  NUMBER,
}

export class InstructionArgValue {
  public type: InstructionArgType;
  public size: X86BitsMode;
  public value: number;

  constructor(
    type: InstructionArgType,
    size: X86BitsMode,
    value: number,
  ) {
    this.type = type;
    this.size = size;
    this.value = value;
  }

  static decodeFromToken(token) {
    return token;
  }
}

/**
 * @see
 * http://www.mathemainzel.info/files/x86asmref.html
 */
export class InstructionSchema {
  public mnemonic: string;
  public argsSchema: string[];
  public binarySchema: string;

  constructor(
    mnemonic: string,
    argsSchema: string|string[],
    binarySchema: string,
  ) {
    this.mnemonic = mnemonic;
    this.binarySchema = binarySchema;
    this.argsSchema = (
      R.is(String, argsSchema)
        ? R.split(' ', <string> argsSchema)
        : <string[]> argsSchema
    );
  }
}

const mapIndexedInstructions = R.mapObjIndexed(
  (instructionList, instructionName) => {
    if (!R.is(Array, instructionList))
      instructionList = [instructionList];

    return R.map(
      ([argsSchema, binarySchema]) => new InstructionSchema(instructionName, argsSchema, binarySchema),
      <any[]> instructionList,
    );
  },
);

export const COMPILER_INSTRUCTIONS_SET = mapIndexedInstructions({
  mov: [
    ['al rmb', 'a0 d0 d1'],
    ['ax rmw', 'a1 d0 d1'],
    ['al ib', 'b0 i0'],
    ['ah ib', 'b4 i0'],
    ['ax iw', 'b8 i0 i1'],
    ['cl ib', 'b1 i0'],
    ['ch ib', 'b5 i0'],
    ['cx iw', 'b9 i0 i1'],
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

  int: [
    ['3', 'CC'],
    ['ib', 'CD i0'],
  ],
});
