import { unsafeAsm } from '../src/asm';

describe('compiler options', () => {
  it('square brackets', () => {
    const compileResult = unsafeAsm()(`
      [bits 16]
      [org 0x7C00]
    `);

    expect(compileResult.compiler).toMatchObject({
      mode: 0x2,
      origin: 0x7c00,
    });
  });

  it('no brackets', () => {
    const compileResult = unsafeAsm()(`
      bits 16
      org 0b01110
    `);

    expect(compileResult.compiler).toMatchObject({
      mode: 0x2,
      origin: 0b01110,
    });
  });
});
