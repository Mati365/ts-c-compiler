import * as R from 'ramda';

import {ASTInstructionSchema} from '../parser/ast/Instruction/ASTInstructionSchema';
import {
  argMatchersFromStr,
  ASTOpcodeMatchers,
} from '../parser/ast/Instruction/ASTInstructionArgMatchers';

const _op = (
  mnemonic: string,
  argsSchema: string,
  binarySchema: string,
) => new ASTInstructionSchema(
  mnemonic,
  argMatchersFromStr(argsSchema),
  R.split(' ', binarySchema),
);

/**
 * @see {@link http://www.mathemainzel.info/files/x86asmref.html}
 */
export const COMPILER_INSTRUCTIONS_SET: ASTOpcodeMatchers = {
  int3: [
    _op('int3', '', '33'),
  ],
  int: [
    _op('int', 'ib', 'CD i0'),
  ],

  hlt: [
    _op('hlt', '', 'F4'),
  ],

  jmp: [
    _op('jmp', 'sl', 'EB r0'),
  ],

  jnc: [
    _op('jnc', 'll', '0F 83 r0 r1'),
    _op('jnc', 'sl', '73 r0'),
  ],

  mov: [
    _op('mov', 'al mw', 'A0 d0 d1'),
    _op('mov', 'ax mw', 'A0 d0 d1'),

    _op('mov', 'al ib', 'B0 i0'),
    _op('mov', 'ah ib', 'B4 i0'),
    _op('mov', 'ax iw', 'B8 i0 i1'),

    _op('mov', 'rmb rb', '88 mr d0 d1'),
    _op('mov', 'rb rmb', '8A mr d0 d1'),
    _op('mov', 'rw rmw', '8B mr d0 d1'),

    // ['al rmb', 'a0 d0 d1'],
    // ['ax rmw', 'a1 d0 d1'],
    // ['al ib', 'b0 i0'],
    // ['ah ib', 'b4 i0'],
    // ['ax iw', 'b8 i0 i1'],
    // ['cl ib', 'b1 i0'],
    // ['ch ib', 'b5 i0'],
    // ['cx iw', 'b9 i0 i1'],
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
};
