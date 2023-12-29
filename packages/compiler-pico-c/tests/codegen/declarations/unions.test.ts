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
      mov word [bp - 4], 5      ; *(data{0}: int*2B) = store %5: int2B
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

    `);
  });
});
