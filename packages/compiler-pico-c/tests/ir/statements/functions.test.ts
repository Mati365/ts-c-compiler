import '../utils/irMatcher';

describe('Functions IR', () => {
  test('should emit return by register from expression primitive types', () => {
    expect(/* cpp */ `
      int sum(int x, int y) { return x + y; }
      void main() { sum(1, 2); }
    `).toCompiledIRBeEqual(/* ruby */`
      # --- Block sum ---
      def sum(x{0}: int*2B, y{0}: int*2B): [ret: int2B]
        %t{0}: int2B = load x{0}: int*2B
        %t{1}: int2B = load y{0}: int*2B
        %t{2}: int2B = %t{0}: int2B plus %t{1}: int2B
        ret %t{2}: int2B


      # --- Block main ---
      def main():
        %t{3}: int sum(int, int)*2B = offset sum
        %t{4}: int2B = call %t{3}: int sum(int, int)*2B :: (%1: int2B, %2: int2B)
        ret
    `);
  });

  test('should emit local primitive variable', () => {
    expect(/* cpp */ `
      int sum(int x, int y) {
        int d = x + y;
        return d;
      }
      void main() { sum(1, 2); }
    `).toCompiledIRBeEqual(/* ruby */`
      # --- Block sum ---
      def sum(x{0}: int*2B, y{0}: int*2B): [ret: int2B]
        d{0}: int*2B = alloca int2B
        %t{0}: int2B = load x{0}: int*2B
        %t{1}: int2B = load y{0}: int*2B
        %t{2}: int2B = %t{0}: int2B plus %t{1}: int2B
        *(d{0}: int*2B) = store %t{2}: int2B
        %t{3}: int2B = load d{0}: int*2B
        ret %t{3}: int2B


      # --- Block main ---
      def main():
        %t{4}: int sum(int, int)*2B = offset sum
        %t{5}: int2B = call %t{4}: int sum(int, int)*2B :: (%1: int2B, %2: int2B)
        ret
    `);
  });

  test('should emit small structures using registers', () => {
    expect(/* cpp */ `
      struct Vec2 { int x; };
      struct Vec2 sum() {
        struct Vec2 out = { .x = 6 };
        return out;
      }
      void main() { sum(); }
    `).toCompiledIRBeEqual(/* ruby */`
      # --- Block sum ---
      def sum(): [ret: struct Vec22B]
        out{0}: struct Vec2*2B = alloca struct Vec22B
        *(out{0}: struct Vec2*2B) = store %6: int2B
        %t{0}: struct Vec22B = load out{0}: struct Vec2*2B
        ret %t{0}: struct Vec22B


      # --- Block main ---
      def main():
        %t{1}: struct Vec2 sum()*2B = offset sum
        %t{2}: struct Vec22B = call %t{1}: struct Vec2 sum()*2B :: ()
        ret
    `);
  });

  test('should return larger structures with RVO', () => {
    expect(/* cpp */ `
      struct Vec2 { int x, y; };
      struct Vec2 sum() {
        struct Vec2 out = { .x = 6 };
        return out;
      }
      void main() {
        sum();
      }
    `).toCompiledIRBeEqual(/* ruby */`
      # --- Block sum ---
      def sum(%out{0}: struct Vec2**2B):
        out{0}: struct Vec2*2B = load %out{0}: struct Vec2**2B
        *(out{0}: struct Vec2*2B) = store %6: int2B
        ret


      # --- Block main ---
      def main():
        %t{1}: struct Vec2 sum()*2B = offset sum
        %t{2}: struct Vec2*2B = alloca struct Vec24B
        call %t{1}: struct Vec2 sum()*2B :: (%t{2}: struct Vec2*2B)
        ret
    `);
  });

  test('should be possible to call function in expressions', () => {
    expect(/* cpp */ `
      int sum(int x, int y) { return x + y; }
      void main() {
        int out = sum(1, 2) + 3;
      }
    `).toCompiledIRBeEqual(/* ruby */`
      # --- Block sum ---
      def sum(x{0}: int*2B, y{0}: int*2B): [ret: int2B]
        %t{0}: int2B = load x{0}: int*2B
        %t{1}: int2B = load y{0}: int*2B
        %t{2}: int2B = %t{0}: int2B plus %t{1}: int2B
        ret %t{2}: int2B


      # --- Block main ---
      def main():
        out{0}: int*2B = alloca int2B
        %t{3}: int sum(int, int)*2B = offset sum
        %t{4}: int2B = call %t{3}: int sum(int, int)*2B :: (%1: int2B, %2: int2B)
        %t{5}: int2B = %t{4}: int2B plus %3: int2B
        *(out{0}: int*2B) = store %t{5}: int2B
        ret
    `);
  });
});
