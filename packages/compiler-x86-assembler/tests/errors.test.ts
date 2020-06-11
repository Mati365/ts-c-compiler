import {MathErrorCode} from '../../compiler-rpn/src/utils/MathError';
import {ParserErrorCode} from '../src/shared/ParserError';

import './utils/asmMatcher';

describe('equ', () => {
  it('handle unknown labels', () => {
    expect('test3 equ test_label + 3').toHasCompilerError(MathErrorCode.UNKNOWN_KEYWORD);
  });

  it('provided empty args list', () => {
    expect('test3 equ').toHasCompilerError(ParserErrorCode.INCORRECT_EQU_ARGS_COUNT);
  });

  it('name already defined', () => {
    expect(`
      xor ax, ax
      mov bx, test3
      test3 equ 0xFF
      test4 equ 0xFE
      test3 equ 2+2
    `).toHasCompilerError(ParserErrorCode.EQU_ALREADY_DEFINED);
  });

  it('name already reserved', () => {
    expect(`
      xor ax, ax
      mov bx, ax
      ax equ 0xFF
    `).toHasCompilerError(ParserErrorCode.USED_RESERVED_NAME);
  });
});

describe('times', () => {
  it('handle broken times value', () => {
    expect('times -1 dyoa').toHasCompilerError(ParserErrorCode.MISSING_TIMES_REPEATED_INSTRUCTION);
  });

  it('handle negative value', () => {
    expect('times (1-10) nop').toHasCompilerError(ParserErrorCode.INCORRECT_TIMES_VALUE);
  });

  it('handle unknown keyword value', () => {
    expect('times dupa nop').toHasCompilerError(MathErrorCode.UNKNOWN_KEYWORD);
  });

  it('handle unknown keyword value', () => {
    expect('times 2 db nop').toHasCompilerError(MathErrorCode.UNKNOWN_KEYWORD);
  });
});

describe('mem', () => {
  it('handle overflow displacement', () => {
    expect('mov bx, [bx:0xFFFFF]').toHasCompilerError(ParserErrorCode.DISPLACEMENT_EXCEEDING_BYTE_SIZE);
  });

  it('handle scale without index bit error in 16bit mode', () => {
    expect(`
      [bits 16]
      mov bx, [es:si+bx]
    `).not.toHasCompilerError(ParserErrorCode.SCALE_INDEX_IS_UNSUPPORTED_IN_MODE);
  });

  it('handle scale > 1 bit error in 16bit mode', () => {
    expect(`
      [bits 16]
      mov bx, [es:si*4+bx]
    `).toHasCompilerError(ParserErrorCode.SCALE_INDEX_IS_UNSUPPORTED_IN_MODE);
  });

  it('handle unknown keyword in mem addr', () => {
    expect('mov bx, [es:bx+si*4+0xF+dupa]').toHasCompilerError(MathErrorCode.UNKNOWN_KEYWORD);
  });
});

describe('instruction', () => {
  it('handle unknown operation', () => {
    expect('movasdasd 0x4, 0x4, 0x4').toHasCompilerError(ParserErrorCode.UNKNOWN_OPERATION);
  });

  it('handle unknown instruction format', () => {
    expect('mov 0x4, 0x4, 0x4').toHasCompilerError(ParserErrorCode.UNKNOWN_COMPILER_INSTRUCTION);
  });

  it('handle doubled sreg prefix conflict', () => {
    expect('ds lds ax, [fs:bx+0x4]').toHasCompilerError(ParserErrorCode.CONFLICT_SREG_OVERRIDE);
  });
});
