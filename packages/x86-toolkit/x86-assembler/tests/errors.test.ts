import { MathErrorCode } from '../../../compiler-rpn/src/utils/MathError';
import { ParserErrorCode } from '../src/shared/ParserError';
import { PreprocessorErrorCode } from '../src/preprocessor/PreprocessorError';

import './utils/asmMatcher';

describe('equ', () => {
  it('handle unknown labels', () => {
    expect('test3 equ test_label + 3').toHaveCompilerError(
      MathErrorCode.UNKNOWN_KEYWORD,
    );
  });

  it('provided empty args list', () => {
    expect('test3 equ').toHaveCompilerError(
      ParserErrorCode.INCORRECT_EQU_ARGS_COUNT,
    );
  });

  it('name already defined', () => {
    const code = `
      xor ax, ax
      mov bx, test3
      test3 equ 0xFF
      test4 equ 0xFE
      test3 equ 2+2
    `;

    expect([code, { preprocessor: false }]).toHaveCompilerError(
      ParserErrorCode.EQU_ALREADY_DEFINED,
    );
    expect([code, { preprocessor: true }]).toHaveCompilerError(
      PreprocessorErrorCode.VARIABLE_ALREADY_EXISTS_IN_CURRENT_SCOPE,
    );
  });

  it('name already reserved', () => {
    expect(`
      xor ax, ax
      mov bx, ax
      ax equ 0xFF
    `).toHaveCompilerError(ParserErrorCode.USED_RESERVED_NAME);
  });
});

describe('times', () => {
  it('handle broken times value', () => {
    expect('times -1 dyoa').toHaveCompilerError(
      ParserErrorCode.MISSING_TIMES_REPEATED_INSTRUCTION,
    );
  });

  it('handle negative value', () => {
    expect('times (1-10) nop').toHaveCompilerError(
      ParserErrorCode.INCORRECT_TIMES_VALUE,
    );
  });

  it('handle unknown keyword value', () => {
    expect('times dupa nop').toHaveCompilerError(MathErrorCode.UNKNOWN_KEYWORD);
  });

  it('handle unknown keyword value', () => {
    expect('times 2 db nop').toHaveCompilerError(MathErrorCode.UNKNOWN_KEYWORD);
  });
});

describe('mem', () => {
  it('handle overflow displacement', () => {
    expect('mov bx, [bx:0xFFFFF]').toHaveCompilerError(
      ParserErrorCode.DISPLACEMENT_EXCEEDING_BYTE_SIZE,
    );
  });

  it('handle impossible register in mem address', () => {
    expect(`
      [bits 16]
      mov bx, [es:si+bx+di]
    `).toHaveCompilerError(ParserErrorCode.IMPOSSIBLE_MEM_REG);
  });

  it('handle scale > 1 bit error in 16bit mode', () => {
    expect(`
      [bits 16]
      mov bx, [es:si*4+bx]
    `).toHaveCompilerError(ParserErrorCode.SCALE_INDEX_IS_UNSUPPORTED_IN_MODE);
  });

  it('handle unknown keyword in mem addr', () => {
    expect('mov bx, [es:bx+si*4+0xF+dupa]').toHaveCompilerError(
      MathErrorCode.UNKNOWN_KEYWORD,
    );
  });

  it('handle unspecified mem arg size', () => {
    expect('mov [0x0], 0x1').toHaveCompilerError(
      ParserErrorCode.MEM_OPERAND_SIZE_NOT_SPECIFIED,
    );
  });
});

describe('instruction', () => {
  it('handle mismatch size', () => {
    expect('mov ax, byte [ds:0xe620]').toHaveCompilerError(
      ParserErrorCode.OPERAND_SIZES_MISMATCH,
    );
    expect('add di, dword 16').toHaveCompilerError(
      ParserErrorCode.OPERAND_SIZES_MISMATCH,
    );

    expect('mov word ax, [ds:0xe620]').not.toHaveCompilerError(
      ParserErrorCode.OPERAND_SIZES_MISMATCH,
    );
    expect('add word di, 16').not.toHaveCompilerError(
      ParserErrorCode.OPERAND_SIZES_MISMATCH,
    );
    expect('add di, 16').not.toHaveCompilerError(
      ParserErrorCode.OPERAND_SIZES_MISMATCH,
    );
  });

  it('handle unknown operation', () => {
    expect('movasdasd 0x4, 0x4, 0x4').toHaveCompilerError(
      ParserErrorCode.UNKNOWN_OPERATION,
    );
  });

  it('handle unknown instruction format', () => {
    expect('mov 0x4, 0x4, 0x4').toHaveCompilerError(
      ParserErrorCode.UNKNOWN_COMPILER_INSTRUCTION,
    );
  });

  it('handle doubled sreg prefix conflict', () => {
    expect('ds lds ax, [fs:bx+0x4]').toHaveCompilerError(
      ParserErrorCode.CONFLICT_SREG_OVERRIDE,
    );
  });
});
