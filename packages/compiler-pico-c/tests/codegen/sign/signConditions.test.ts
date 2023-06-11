import '../utils';

describe('Sign conditions', () => {
  describe('unsigned', () => {
    test('a > b', () => {
      expect(/* cpp */ `
        void main() {
          unsigned int a = 3, b = 1;

          if (a > b) {
            int k;
            k = 7;
          }
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        sub sp, 6
        mov word [bp - 2], 3      ; *(a{0}: unsigned int*2B) = store %3: unsigned int2B
        mov word [bp - 4], 1      ; *(b{0}: unsigned int*2B) = store %1: unsigned int2B
        mov ax, [bp - 4]
        cmp word [bp - 2], ax     ; %t{2}: i1:zf = icmp %t{0}: unsigned int2B greater_than %t{1}: unsigned int2B
        jbe @@_L1                 ; br %t{2}: i1:zf, false: L1
        @@_L2:
        mov word [bp - 6], 7      ; *(k{0}: int*2B) = store %7: char1B
        @@_L1:
        mov sp, bp
        pop bp
        ret
      `);
    });

    test('a >= b', () => {
      expect(/* cpp */ `
        void main() {
          unsigned int a = 3, b = 1;

          if (a >= b) {
            int k;
            k = 7;
          }
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        sub sp, 6
        mov word [bp - 2], 3      ; *(a{0}: unsigned int*2B) = store %3: unsigned int2B
        mov word [bp - 4], 1      ; *(b{0}: unsigned int*2B) = store %1: unsigned int2B
        mov ax, [bp - 4]
        cmp word [bp - 2], ax     ; %t{2}: i1:zf = icmp %t{0}: unsigned int2B greater_eq_than %t{1}: unsigned int2B
        jnae @@_L1                ; br %t{2}: i1:zf, false: L1
        @@_L2:
        mov word [bp - 6], 7      ; *(k{0}: int*2B) = store %7: char1B
        @@_L1:
        mov sp, bp
        pop bp
        ret
      `);
    });

    test('a < b', () => {
      expect(/* cpp */ `
        void main() {
          unsigned int a = 3, b = 1;

          if (a < b) {
            int k;
            k = 7;
          }
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        sub sp, 6
        mov word [bp - 2], 3      ; *(a{0}: unsigned int*2B) = store %3: unsigned int2B
        mov word [bp - 4], 1      ; *(b{0}: unsigned int*2B) = store %1: unsigned int2B
        mov ax, [bp - 4]
        cmp word [bp - 2], ax     ; %t{2}: i1:zf = icmp %t{0}: unsigned int2B less_than %t{1}: unsigned int2B
        jnb @@_L1                 ; br %t{2}: i1:zf, false: L1
        @@_L2:
        mov word [bp - 6], 7      ; *(k{0}: int*2B) = store %7: char1B
        @@_L1:
        mov sp, bp
        pop bp
        ret
      `);
    });

    test('a <= b', () => {
      expect(/* cpp */ `
        void main() {
          unsigned int a = 3, b = 1;

          if (a <= b) {
            int k;
            k = 7;
          }
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        sub sp, 6
        mov word [bp - 2], 3      ; *(a{0}: unsigned int*2B) = store %3: unsigned int2B
        mov word [bp - 4], 1      ; *(b{0}: unsigned int*2B) = store %1: unsigned int2B
        mov ax, [bp - 4]
        cmp word [bp - 2], ax     ; %t{2}: i1:zf = icmp %t{0}: unsigned int2B less_eq_than %t{1}: unsigned int2B
        ja @@_L1                  ; br %t{2}: i1:zf, false: L1
        @@_L2:
        mov word [bp - 6], 7      ; *(k{0}: int*2B) = store %7: char1B
        @@_L1:
        mov sp, bp
        pop bp
        ret
      `);
    });
  });

  describe('signed', () => {
    test('a > b', () => {
      expect(/* cpp */ `
        void main() {
          int a = 3, b = 1;

          if (a > b) {
            int k;
            k = 7;
          }
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        sub sp, 6
        mov word [bp - 2], 3      ; *(a{0}: int*2B) = store %3: int2B
        mov word [bp - 4], 1      ; *(b{0}: int*2B) = store %1: int2B
        mov ax, [bp - 4]
        cmp word [bp - 2], ax     ; %t{2}: i1:zf = icmp %t{0}: int2B greater_than %t{1}: int2B
        jng @@_L1                 ; br %t{2}: i1:zf, false: L1
        @@_L2:
        mov word [bp - 6], 7      ; *(k{0}: int*2B) = store %7: char1B
        @@_L1:
        mov sp, bp
        pop bp
        ret
      `);
    });

    test('a >= b', () => {
      expect(/* cpp */ `
        void main() {
          int a = 3, b = 1;

          if (a >= b) {
            int k;
            k = 7;
          }
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        sub sp, 6
        mov word [bp - 2], 3      ; *(a{0}: int*2B) = store %3: int2B
        mov word [bp - 4], 1      ; *(b{0}: int*2B) = store %1: int2B
        mov ax, [bp - 4]
        cmp word [bp - 2], ax     ; %t{2}: i1:zf = icmp %t{0}: int2B greater_eq_than %t{1}: int2B
        jnge @@_L1                ; br %t{2}: i1:zf, false: L1
        @@_L2:
        mov word [bp - 6], 7      ; *(k{0}: int*2B) = store %7: char1B
        @@_L1:
        mov sp, bp
        pop bp
        ret
      `);
    });

    test('a < b', () => {
      expect(/* cpp */ `
        void main() {
          int a = 3, b = 1;

          if (a < b) {
            int k;
            k = 7;
          }
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        sub sp, 6
        mov word [bp - 2], 3      ; *(a{0}: int*2B) = store %3: int2B
        mov word [bp - 4], 1      ; *(b{0}: int*2B) = store %1: int2B
        mov ax, [bp - 4]
        cmp word [bp - 2], ax     ; %t{2}: i1:zf = icmp %t{0}: int2B less_than %t{1}: int2B
        jge @@_L1                 ; br %t{2}: i1:zf, false: L1
        @@_L2:
        mov word [bp - 6], 7      ; *(k{0}: int*2B) = store %7: char1B
        @@_L1:
        mov sp, bp
        pop bp
        ret
      `);
    });

    test('a <= b', () => {
      expect(/* cpp */ `
        void main() {
          int a = 3, b = 1;

          if (a <= b) {
            int k;
            k = 7;
          }
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        sub sp, 6
        mov word [bp - 2], 3      ; *(a{0}: int*2B) = store %3: int2B
        mov word [bp - 4], 1      ; *(b{0}: int*2B) = store %1: int2B
        mov ax, [bp - 4]
        cmp word [bp - 2], ax     ; %t{2}: i1:zf = icmp %t{0}: int2B less_eq_than %t{1}: int2B
        jg @@_L1                  ; br %t{2}: i1:zf, false: L1
        @@_L2:
        mov word [bp - 6], 7      ; *(k{0}: int*2B) = store %7: char1B
        @@_L1:
        mov sp, bp
        pop bp
        ret
      `);
    });
  });
});
