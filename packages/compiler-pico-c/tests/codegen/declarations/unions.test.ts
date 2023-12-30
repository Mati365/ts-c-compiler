import '../utils';

describe('Unions', () => {
  test('proper assign to int array in union', () => {
    expect(/* cpp */ `
      union Data {
        int ch[2];
        char k;
      };

      void main() {
        union Data data;

        data.ch[1] = 1;
        data.ch[0] = 1;
        data.k = 5;
      }
    `).toCompiledAsmBeEqual(`
      cpu 386
      ; def main():
      @@_fn_main:
      push bp
      mov bp, sp
      sub sp, 4
      mov word [bp - 2], 1      ; *(data{0}: int[2]*2B + %2) = store %1: char1B
      mov word [bp - 4], 1      ; *(data{0}: int[2]*2B) = store %1: char1B
      mov byte [bp - 4], 5      ; *(data{0}: char*2B) = store %5: char1B
      mov sp, bp
      pop bp
      ret
    `);
  });

  test('assign to struct inside union', () => {
    expect(/* cpp */ `
      union Data {
        char i, j;

        struct Vec2 {
          int x, y;
          char dupa[10];
        } vecs[2];

        char ch[2];
      };

      void main() {
        union Data data;

        data.vecs[1].x = 2;
        data.i = 5;
        data.ch[2] = 1;
      }
    `).toCompiledAsmBeEqual(`
      cpu 386
      ; def main():
      @@_fn_main:
      push bp
      mov bp, sp
      sub sp, 28
      mov word [bp - 14], 2     ; *(data{0}: struct Vec2[2]*2B + %14) = store %2: char1B
      mov byte [bp - 28], 5     ; *(data{0}: char*2B) = store %5: char1B
      mov byte [bp - 26], 1     ; *(data{0}: char[2]*2B + %2) = store %1: char1B
      mov sp, bp
      pop bp
      ret
    `);
  });

  test('assign to array using dynamic index inside union', () => {
    expect(/* cpp */ `
      union Data {
        int ch[2];
        char k;
      };

      void main() {
        int x = 1;
        union Data data;

        data.ch[x] = 1;
        data.ch[0] = 1;
        data.k = 5;
      }
    `).toCompiledAsmBeEqual(`
      cpu 386
      ; def main():
      @@_fn_main:
      push bp
      mov bp, sp
      sub sp, 6
      mov word [bp - 2], 1      ; *(x{0}: int*2B) = store %1: int2B
      lea bx, [bp - 6]          ; %t{0}: union Data**2B = lea data{0}: union Data*2B
      mov ax, [bp - 2]
      shl ax, 1                 ; %t{2}: int[2]*2B = %t{1}: int2B mul %2: int2B
      add bx, ax                ; %t{3}: int[2]*2B = %t{0}: int[2]*2B plus %t{2}: int[2]*2B
      mov word [bx], 1          ; *(%t{3}: int[2]*2B) = store %1: char1B
      mov word [bp - 6], 1      ; *(data{0}: int[2]*2B) = store %1: char1B
      mov byte [bp - 6], 5      ; *(data{0}: char*2B) = store %5: char1B
      mov sp, bp
      pop bp
      ret
    `);
  });

  test('union basic initializer', () => {
    expect(/* cpp */ `
      union Data {
        int ch[2];
        char k;
      };

      void main() {
        union Data data = { .k = 5 };
      }
    `).toCompiledAsmBeEqual(`
      cpu 386
      ; def main():
      @@_fn_main:
      push bp
      mov bp, sp
      sub sp, 4
      mov byte [bp - 4], 5      ; *(data{0}: char*2B) = store %5: char1B
      mov sp, bp
      pop bp
      ret
    `);
  });

  test('union nested array initializer', () => {
    expect(/* cpp */ `
      union Data {
        int ch[2];
        char k;
      };

      void main() {
        union Data data = { .ch = { 1, 2 } };
      }
    `).toCompiledAsmBeEqual(`
      cpu 386
      ; def main():
      @@_fn_main:
      push bp
      mov bp, sp
      sub sp, 4
      mov word [bp - 4], 1      ; *(data{0}: int*2B) = store %1: int2B
      mov word [bp - 2], 2      ; *(data{0}: int*2B + %2) = store %2: int2B
      mov sp, bp
      pop bp
      ret
    `);
  });

  test('union that fits reg is returned from function', () => {
    expect(/* cpp */ `
      union Data {
        char k;
      };

      union Data fun() {
        union Data tmp = {
          .k = 2
        };

        return tmp;
      };

      void main() {
        union Data data = fun();
      }
    `).toCompiledAsmBeEqual(`
        cpu 386
        ; def fun(): [ret: union Data1B]
        @@_fn_fun:
        push bp
        mov bp, sp
        sub sp, 1
        mov byte [bp - 1], 2      ; *(tmp{0}: char*2B) = store %2: char1B
        mov al, [bp - 1]
        mov sp, bp
        pop bp
        ret

        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        sub sp, 1
        call @@_fn_fun
        mov byte [bp - 1], al     ; *(data{0}: union Data*2B) = store %t{2}: union Data1B
        mov sp, bp
        pop bp
        ret
    `);
  });

  test('reading data from union member works', () => {
    expect(/* cpp */ `
      typedef union Data {
        char k;
        int a[4];
      } abc;

      void main() {
        abc data  = {
          .a = { 1, 2, 3, 4 }
        };

        int k = data.a[2];
        asm("xchg dx, dx");
      }
    `).toCompiledAsmBeEqual(`
      cpu 386
      ; def main():
      @@_fn_main:
      push bp
      mov bp, sp
      sub sp, 10
      mov word [bp - 8], 1      ; *(data{0}: int*2B) = store %1: int2B
      mov word [bp - 6], 2      ; *(data{0}: int*2B + %2) = store %2: int2B
      mov word [bp - 4], 3      ; *(data{0}: int*2B + %4) = store %3: int2B
      mov word [bp - 2], 4      ; *(data{0}: int*2B + %6) = store %4: int2B
      lea bx, [bp - 8]          ; %t{0}: union Data**2B = lea data{0}: union Data*2B
      add bx, 4                 ; %t{1}: int[4]*2B = %t{0}: int[4]*2B plus %4: int2B
      mov ax, [bx]              ; %t{2}: int2B = load %t{1}: int[4]*2B
      mov word [bp - 10], ax    ; *(k{0}: int*2B) = store %t{2}: int2B
      xchg dx, dx
      mov sp, bp
      pop bp
      ret
    `);
  });

  test('c89 initializer for single char value', () => {
    expect(/* cpp */ `
      typedef union Data {
        char k;
        int a[4];
      } abc;

      void main() {
        abc data  = { 1 };

        int k = data.a[0];
        asm("xchg dx, dx");
      }
    `).toCompiledAsmBeEqual(`
      cpu 386
      ; def main():
      @@_fn_main:
      push bp
      mov bp, sp
      sub sp, 10
      mov byte [bp - 8], 1      ; *(data{0}: char*2B) = store %1: char1B
      lea bx, [bp - 8]          ; %t{0}: union Data**2B = lea data{0}: union Data*2B
      mov ax, [bx]              ; %t{2}: int2B = load %t{1}: int[4]*2B
      mov word [bp - 10], ax    ; *(k{0}: int*2B) = store %t{2}: int2B
      xchg dx, dx
      mov sp, bp
      pop bp
      ret
    `);
  });
});
