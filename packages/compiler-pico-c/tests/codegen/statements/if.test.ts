import '../utils';

describe('If statement', () => {
  describe('Basic if statements', () => {
    test('if (<fn arg> < 0)', () => {
      expect(/* cpp */ `
        void sum(int x) {
          if (x < 0) {
            asm("xchg bx, bx");
          }
        }

        void main() {
          sum(-10);
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def sum(x{0}: int*2B):
        @@_fn_sum:
        push bp
        mov bp, sp
        cmp word [bp + 4], 0      ; %t{1}: i1:zf = icmp %t{0}: int2B less_than %0: char1B
        jge @@_L1                 ; br %t{1}: i1:zf, false: L1
        @@_L2:
        xchg bx, bx
        @@_L1:
        mov sp, bp
        pop bp
        ret 2
        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        push word -10
        call @@_fn_sum
        mov sp, bp
        pop bp
        ret
      `);
    });

    test('if (!(pad & PAD_RIGHT))', () => {
      expect(/* cpp */ `
        #define PAD_RIGHT 2

        void main() {
          int pad = 0;

          if (!(pad & PAD_RIGHT)) {
            asm("xchg bx, bx");
          }
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        sub sp, 2
        mov word [bp - 2], 0      ; *(pad{0}: int*2B) = store %0: int2B
        mov ax, [bp - 2]
        and ax, 2                 ; %t{1}: int2B = %t{0}: int2B bit_and %2: char1B
        xor ax, 1                 ; %t{2}: int2B = not %t{1}: int2B
        cmp ax, 0                 ; %t{3}: i1:zf = icmp %t{2}: int2B differs %0: int2B
        jz @@_L1                  ; br %t{3}: i1:zf, false: L1
        @@_L2:
        xchg bx, bx
        @@_L1:
        mov sp, bp
        pop bp
        ret
      `);
    });

    test('if (a: char > 4)', () => {
      expect(/* cpp */ `
        void main() {
          char a = 'a';

          if (a > 4) {
            int k = 0;
          }
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        sub sp, 3
        mov byte [bp - 1], 97     ; *(a{0}: char*2B) = store %97: char1B
        cmp byte [bp - 1], 4      ; %t{1}: i1:zf = icmp %t{0}: char1B greater_than %4: char1B
        jng @@_L1                 ; br %t{1}: i1:zf, false: L1
        @@_L2:
        mov word [bp - 3], 0      ; *(k{0}: int*2B) = store %0: int2B
        @@_L1:
        mov sp, bp
        pop bp
        ret
      `);
    });

    test('if (a: char > 4 && b: int == 4)', () => {
      expect(/* cpp */ `
        void main() {
          char a = 'a';
          int b = 4;

          if (a > 4 && b == 4) {
            int k = 0;
          }
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        sub sp, 5
        mov byte [bp - 1], 97     ; *(a{0}: char*2B) = store %97: char1B
        mov word [bp - 3], 4      ; *(b{0}: int*2B) = store %4: int2B
        cmp byte [bp - 1], 4      ; %t{1}: i1:zf = icmp %t{0}: char1B greater_than %4: char1B
        jng @@_L1                 ; br %t{1}: i1:zf, false: L1
        @@_L3:
        cmp word [bp - 3], 4      ; %t{3}: i1:zf = icmp %t{2}: int2B equal %4: char1B
        jz @@_L2                  ; br %t{3}: i1:zf, true: L2
        jmp @@_L1                 ; jmp L1
        @@_L2:
        mov word [bp - 5], 0      ; *(k{0}: int*2B) = store %0: int2B
        @@_L1:
        mov sp, bp
        pop bp
        ret
      `);
    });

    test('if (a: char > b: int)', () => {
      expect(/* cpp */ `
        void main() {
          char a = 'a';
          int b = 4;

          if (a > b && a < 98) {
            int k = 0;
            asm("xchg bx, bx");
          }
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        sub sp, 5
        mov byte [bp - 1], 97     ; *(a{0}: char*2B) = store %97: char1B
        mov word [bp - 3], 4      ; *(b{0}: int*2B) = store %4: int2B
        movzx ax, byte [bp - 1]
        mov bx, [bp - 3]
        cmp ax, bx                ; %t{3}: i1:zf = icmp %t{2}: int2B greater_than %t{1}: int2B
        jng @@_L1                 ; br %t{3}: i1:zf, false: L1
        @@_L3:
        cmp byte [bp - 1], 98     ; %t{5}: i1:zf = icmp %t{4}: char1B less_than %98: char1B
        jl @@_L2                  ; br %t{5}: i1:zf, true: L2
        jmp @@_L1                 ; jmp L1
        @@_L2:
        mov word [bp - 5], 0      ; *(k{0}: int*2B) = store %0: int2B
        xchg bx, bx
        @@_L1:
        mov sp, bp
        pop bp
        ret
      `);
    });

    test('if (a: char > b: int && a: char + 4 > b: int', () => {
      expect(/* cpp */ `
        void main() {
          char a = 'a';
          int b = 4;
          if (a > b && a + 4 > b) {
            int k = 0;
          }
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        sub sp, 5
        mov byte [bp - 1], 97     ; *(a{0}: char*2B) = store %97: char1B
        mov word [bp - 3], 4      ; *(b{0}: int*2B) = store %4: int2B
        movzx ax, byte [bp - 1]
        mov bx, [bp - 3]
        cmp ax, bx                ; %t{3}: i1:zf = icmp %t{2}: int2B greater_than %t{1}: int2B
        jng @@_L1                 ; br %t{3}: i1:zf, false: L1
        @@_L3:
        mov al, [bp - 1]
        add al, 4                 ; %t{5}: char1B = %t{4}: char1B plus %4: char1B
        movzx ax, al
        mov bx, [bp - 3]
        cmp ax, bx                ; %t{8}: i1:zf = icmp %t{7}: int2B greater_than %t{6}: int2B
        jg @@_L2                  ; br %t{8}: i1:zf, true: L2
        jmp @@_L1                 ; jmp L1
        @@_L2:
        mov word [bp - 5], 0      ; *(k{0}: int*2B) = store %0: int2B
        @@_L1:
        mov sp, bp
        pop bp
        ret
      `);
    });
  });

  describe('Else If statements', () => {
    test('if (...) else { ... }', () => {
      expect(/* cpp */ `
        void main() {
          char a = 'a';

          if (a > 4) {
            int k = 0;
          } else {
            int j = 4;
          }
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        sub sp, 5
        mov byte [bp - 1], 97     ; *(a{0}: char*2B) = store %97: char1B
        cmp byte [bp - 1], 4      ; %t{1}: i1:zf = icmp %t{0}: char1B greater_than %4: char1B
        jng @@_L3                 ; br %t{1}: i1:zf, false: L3
        @@_L2:
        mov word [bp - 3], 0      ; *(k{0}: int*2B) = store %0: int2B
        jmp @@_L1                 ; jmp L1
        @@_L3:
        mov word [bp - 5], 4      ; *(j{0}: int*2B) = store %4: int2B
        @@_L1:
        mov sp, bp
        pop bp
        ret
      `);
    });

    test('if (...) else if (...) else { ... }', () => {
      expect(/* cpp */ `
        void main() {
          char a = 'a';

          if (a > 4) {
            int k = 0;
          } else if (a < 5) {
            int j = 4;
          } else {
            int c = 4;
          }
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        sub sp, 7
        mov byte [bp - 1], 97     ; *(a{0}: char*2B) = store %97: char1B
        cmp byte [bp - 1], 4      ; %t{1}: i1:zf = icmp %t{0}: char1B greater_than %4: char1B
        jng @@_L3                 ; br %t{1}: i1:zf, false: L3
        @@_L2:
        mov word [bp - 3], 0      ; *(k{0}: int*2B) = store %0: int2B
        jmp @@_L4                 ; jmp L4
        @@_L3:
        cmp byte [bp - 1], 5      ; %t{3}: i1:zf = icmp %t{2}: char1B less_than %5: char1B
        jge @@_L6                 ; br %t{3}: i1:zf, false: L6
        @@_L5:
        mov word [bp - 5], 4      ; *(j{0}: int*2B) = store %4: int2B
        jmp @@_L4                 ; jmp L4
        @@_L6:
        mov word [bp - 7], 4      ; *(c{0}: int*2B) = store %4: int2B
        @@_L4:
        mov sp, bp
        pop bp
        ret
      `);
    });
  });
});
