import {CompilerFinalResult} from '../src/parser';
import {asm} from '../src/asm';

describe('compiler options', () => {
  let compileResult: CompilerFinalResult = null;

  it('square brackets', () => {
    compileResult = asm`
      [bits 16]
      [org 0x7C00]
    `;

    expect(compileResult.compiler).toMatchObject(
      {
        mode: 0x2,
        origin: 0x7C00,
      },
    );
  });

  it('no brackets', () => {
    compileResult = asm`
      bits 16
      org 0b01110
    `;

    expect(compileResult.compiler).toMatchObject(
      {
        mode: 0x2,
        origin: 0b01110,
      },
    );
  });
});
