import '../utils';

describe('Ternary assign', () => {
  test.skip('simple ternary assign', () => {
    expect(/* cpp */ `
      void main() {
        int a = 2;
        int b = a > 3 ? 1 : 3;
      }
    `).toCompiledIRBeEqual(/* ruby */ `
    `);
  });
});
