import '../utils';

describe('goto', () => {
  test('basic goto in plain function', () => {
    expect(/* cpp */ `
      void main() {
        int a = 2;
        goto skok;

        asm("xchg bx, bx");

        skok:
        int b;
      }
    `).toCompiledAsmBeEqual(`
    `);
  });
});
