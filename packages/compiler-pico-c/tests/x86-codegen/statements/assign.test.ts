import '../utils';

describe('Variable assign', () => {
  describe('Assign to plain variable', () => {
    test('b += letters[0] * 2', () => {
      expect(/* cpp */ `
        void main() {
          char letters[] = "He";
          int a = 0;

          a += letters[0] * 2;
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        mov word [bp - 2], 25928  ; *(letters{0}: int*2B) = store %25928: int2B
        mov word [bp - 4], 0      ; *(a{0}: int*2B) = store %0: int2B
        lea bx, [bp - 2]          ; %t{0}: char*2B = lea letters{0}: char[2]*2B
        mov al, [bx]              ; %t{1}: char1B = load %t{0}: char*2B
        movzx cx, al
        imul cx, 2                ; %t{2}: char1B = %t{1}: char1B mul %2: char1B
        mov al, [bp - 4]
        add al, cl                ; %t{4}: char1B = %t{3}: char1B plus %t{2}: char1B
        movzx dx, al
        mov word [bp - 4], dx     ; *(a{0}: int*2B) = store %t{4}: char1B
        pop bp
        ret
      `);
    });

    test('compiler reuses variable that is already placed in reg', () => {
      expect(/* cpp */ `
        void main() {
          int a = 2;
          a = a + 6;
          // sum(4, 4);
          a = a + 5;
        }
      `).toCompiledAsmBeEqual(`
      `);
    });

    test('compiler does not reuse variable if branch is between statements', () => {
      expect(/* cpp */ `
        void sum() {}
        void main() {
          int a = 2;
          a = a + 6;
          sum();
          a = a + 5;
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def sum():
        @@_fn_sum:
        push bp
        mov bp, sp
        pop bp
        ret

        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        mov word [bp - 2], 2      ; *(a{0}: int*2B) = store %2: int2B
        mov ax, [bp - 2]
        add ax, 6                 ; %t{1}: int2B = %t{0}: int2B plus %6: char1B
        mov word [bp - 2], ax     ; *(a{0}: int*2B) = store %t{1}: int2B
        call @@_fn_sum
        mov bx, [bp - 2]
        add bx, 5                 ; %t{4}: int2B = %t{3}: int2B plus %5: char1B
        mov word [bp - 2], bx     ; *(a{0}: int*2B) = store %t{4}: int2B
        pop bp
        ret
      `);
    });
  });

  describe('Assign to array item', () => {
    test('array non bracket assign', () => {
      expect(/* cpp */ `
        void main() {
          int testArray[] = { 1, 2, 3, 4, 5, 6 };
          *(1 + testArray + (2 * 2)) = 123;
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        mov word [bp - 12], 1     ; *(testArray{0}: int[6]*2B) = store %1: int2B
        mov word [bp - 10], 2     ; *(testArray{0}: int[6]*2B + %2) = store %2: int2B
        mov word [bp - 8], 3      ; *(testArray{0}: int[6]*2B + %4) = store %3: int2B
        mov word [bp - 6], 4      ; *(testArray{0}: int[6]*2B + %6) = store %4: int2B
        mov word [bp - 4], 5      ; *(testArray{0}: int[6]*2B + %8) = store %5: int2B
        mov word [bp - 2], 123    ; *(testArray{0}: int[6]*2B + %10) = store %123: char1B
        pop bp
        ret
      `);
    });
  });

  describe('Assign specific address', () => {
    test('int: *(addr) = 2;', () => {
      expect(/* cpp */ `
        void main() {
          int* addr = 0xB00;
          *(addr) = 2;
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        mov word [bp - 2], 2816   ; *(addr{0}: int**2B) = store %2816: int*2B
        mov bx, [bp - 2]          ; %t{0}: int*2B = load addr{0}: int**2B
        mov word [bx], 2          ; *(%t{0}: int*2B) = store %2: char1B
        pop bp
        ret
      `);
    });

    test('char: *(addr) = 2;', () => {
      expect(/* cpp */ `
        void main() {
          char* addr = 0xB00;
          *(addr) = 2;
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        mov word [bp - 2], 2816   ; *(addr{0}: char**2B) = store %2816: char*2B
        mov bx, [bp - 2]          ; %t{0}: char*2B = load addr{0}: char**2B
        mov byte [bx], 2          ; *(%t{0}: char*2B) = store %2: char1B
        pop bp
        ret
      `);
    });
  });
});
