import '../utils/irMatcher';

describe('While stmt', () => {
  test('basic if statement', () => {
    expect(/* cpp */ `
      void main() {
        while(2 > 1) {}
      }
    `).toCompiledIRBeEqual(/* ruby */`
        # --- Block main ---
        def main():
        # --- Block L1 ---
          L1:
          if: %t{0}: int2B equal %0: int2B then L2
          jmp L1:
        # --- Block L2 ---
          L2:
          ret
    `);
  });
});
