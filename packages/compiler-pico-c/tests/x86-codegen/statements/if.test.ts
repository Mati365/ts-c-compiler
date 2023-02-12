import '../utils';

describe('If statement', () => {
  describe('Basic if statements', () => {
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
        mov byte [bp - 1], 97     ; *(a{0}: char*2B) = store %97: char1B
        cmp byte [bp - 1], 4      ; %t{1}: i1:zf = icmp %t{0}: char1B greater_than %4: char1B
        jng @@_L1                 ; br %t{1}: i1:zf, false: L1
        @@_L2:
        mov word [bp - 3], 0      ; *(k{0}: int*2B) = store %0: int2B
        @@_L1:
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
        pop bp
        ret
      `);
    });

    test('if (a: char > b: int)', () => {
      expect(/* cpp */ `
        void main() {
          char a = 'a';
          int b = 4;

          if (a > b) {
            int k = 0;
          }
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        mov byte [bp - 1], 97     ; *(a{0}: char*2B) = store %97: char1B
        mov word [bp - 3], 4      ; *(b{0}: int*2B) = store %4: int2B
        mov ax, word [bp - 1]
        and ax, 0xff
        mov bx, [bp - 3]
        cmp ax, bx                ; %t{2}: i1:zf = icmp %t{0}: char1B greater_than %t{1}: int2B
        jng @@_L1                 ; br %t{2}: i1:zf, false: L1
        @@_L2:
        mov word [bp - 5], 0      ; *(k{0}: int*2B) = store %0: int2B
        @@_L1:
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
        mov byte [bp - 1], 97     ; *(a{0}: char*2B) = store %97: char1B
        mov word [bp - 3], 4      ; *(b{0}: int*2B) = store %4: int2B
        mov ax, word [bp - 1]
        and ax, 0xff
        mov bx, [bp - 3]
        cmp ax, bx                ; %t{2}: i1:zf = icmp %t{0}: char1B greater_than %t{1}: int2B
        jng @@_L1                 ; br %t{2}: i1:zf, false: L1
        @@_L3:
        mov al, [bp - 1]
        add al, 4                 ; %t{4}: char1B = %t{3}: char1B plus %4: char1B
        movzx bx, al
        mov ax, [bp - 3]
        cmp bx, ax                ; %t{6}: i1:zf = icmp %t{4}: char1B greater_than %t{5}: int2B
        jg @@_L2                  ; br %t{6}: i1:zf, true: L2
        jmp @@_L1                 ; jmp L1
        @@_L2:
        mov word [bp - 5], 0      ; *(k{0}: int*2B) = store %0: int2B
        @@_L1:
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
        mov byte [bp - 1], 97     ; *(a{0}: char*2B) = store %97: char1B
        cmp byte [bp - 1], 4      ; %t{1}: i1:zf = icmp %t{0}: char1B greater_than %4: char1B
        jng @@_L3                 ; br %t{1}: i1:zf, false: L3
        @@_L2:
        mov word [bp - 3], 0      ; *(k{0}: int*2B) = store %0: int2B
        jmp @@_L1                 ; jmp L1
        @@_L3:
        mov word [bp - 5], 4      ; *(j{0}: int*2B) = store %4: int2B
        @@_L1:
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
        pop bp
        ret
      `);
    });
  });
});
