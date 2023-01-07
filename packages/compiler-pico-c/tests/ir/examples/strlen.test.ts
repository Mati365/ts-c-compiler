import '../utils/irMatcher';

describe('Example: Strlen', () => {
  test('Strlen definition', () => {
    expect(/* cpp */ `
      int strlen(const char* str) {
        for (int i = 0;;++i) {
          if (*(str + i) == '0') {
            return i;
          }
        }

        return -1;
      }
    `).toCompiledIRBeEqual(/* ruby */ `
      # --- Block strlen ---
      def strlen(str{0}: const char**2B): [ret: int2B]
        i{0}: int*2B = alloca int2B
        *(i{0}: int*2B) = store %0: int2B
        L1:
        %t{2}: const char*2B = load str{0}: const char**2B
        %t{3}: int2B = load i{0}: int*2B
        %t{4}: const char*2B = %t{2}: const char*2B plus %t{3}: int2B
        %t{5}: const char1B = load %t{4}: const char*2B
        %t{6}: i1:zf = icmp %t{5}: const char1B equal %48: char1B
        br %t{6}: i1:zf, false: L3
        L4:
        %t{7}: int2B = load i{0}: int*2B
        ret %t{7}: int2B
        L3:
        %t{0}: int2B = load i{0}: int*2B
        %t{1}: int2B = %t{0}: int2B plus %1: int2B
        *(i{0}: int*2B) = store %t{1}: int2B
        jmp L1
        ret %-1: int2B
        end-def
    `);
  });
});
