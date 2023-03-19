import '../utils';

describe('Global variables declaration', () => {
  test('can read primitive global variable', () => {
    expect(/* cpp */ `
      int j;

      void main() {
        int k = j;
      }
    `).toCompiledAsmBeEqual(`
      cpu 386
      ; def main():
      @@_fn_main:
      push bp
      mov bp, sp
      sub sp, 2
      mov ax, word [@@_c_0_]    ; %t{1}: int*2B = load %t{0}: int**2B
      mov word [bp - 2], ax     ; *(k{0}: int*2B) = store %t{1}: int*2B
      mov sp, bp
      pop bp
      ret
      @@_c_0_: db 0, 0
    `);
  });

  test('can write primitive global variable', () => {
    expect(/* cpp */ `
      int j;

      void main() {
        j = 8;
      }
    `).toCompiledAsmBeEqual(`
      cpu 386
      ; def main():
      @@_fn_main:
      push bp
      mov bp, sp
      mov word [@@_c_0_], 8     ; *(%t{0}: int*2B) = store %8: char1B
      mov sp, bp
      pop bp
      ret

      @@_c_0_: db 0, 0
    `);
  });

  test('read and assign from global array', () => {
    expect(/* cpp */ `
      int j[3];
      int c;

      void main() {
        int k = j[1];
        j[1] = 2;
      }
    `).toCompiledAsmBeEqual(`
      cpu 386
      ; def main():
      @@_fn_main:
      push bp
      mov bp, sp
      sub sp, 2
      mov ax, @@_c_0_
      mov bx, ax                ; swap
      add ax, 2                 ; %t{1}: int*2B = %t{0}: int*2B plus %2: int2B
      mov di, ax
      mov ax, [di]              ; %t{2}: int2B = load %t{1}: int*2B
      mov word [bp - 2], ax     ; *(k{0}: int*2B) = store %t{2}: int2B
      add bx, 2                 ; %t{4}: int*2B = %t{0}: int*2B plus %2: int2B
      mov word [bx], 2          ; *(%t{4}: int*2B) = store %2: char1B
      mov sp, bp
      pop bp
      ret

      @@_c_0_: db 0, 0, 0, 0, 0, 0
      @@_c_1_: db 0, 0
    `);
  });

  test('advanced global variables arithmetic', () => {
    expect(/* cpp */ `
      int j[] = { 1, 2, 3 };
      int s = 3;

      void main() {
        j[2] *= s;

        int k = j[2] + 2;
        int c = j[2] - 2;
        int sum = (k + c) * (k - c);
      }
    `).toCompiledAsmBeEqual(`
      cpu 386
      ; def main():
      @@_fn_main:
      push bp
      mov bp, sp
      sub sp, 6
      mov ax, @@_c_0_
      mov bx, ax                ; swap
      add ax, 4                 ; %t{1}: int*2B = %t{0}: int*2B plus %4: int2B
      mov cx, word [@@_c_1_]    ; %t{3}: int*2B = load %t{2}: int**2B
      mov di, ax
      mov ax, [di]              ; %t{4}: int2B = load %t{1}: int*2B
      imul ax, cx               ; %t{5}: int2B = %t{4}: int2B mul %t{3}: int*2B
      mov word [di], ax         ; *(%t{1}: int*2B) = store %t{5}: int2B
      mov dx, bx                ; swap
      add bx, 4                 ; %t{7}: int*2B = %t{0}: int*2B plus %4: int2B
      mov ax, [bx]              ; %t{8}: int2B = load %t{7}: int*2B
      add ax, 2                 ; %t{9}: int2B = %t{8}: int2B plus %2: char1B
      mov word [bp - 2], ax     ; *(k{0}: int*2B) = store %t{9}: int2B
      add dx, 4                 ; %t{11}: int*2B = %t{0}: int*2B plus %4: int2B
      mov bx, dx
      mov cx, [bx]              ; %t{12}: int2B = load %t{11}: int*2B
      sub cx, 2                 ; %t{13}: int2B = %t{12}: int2B minus %2: char1B
      mov word [bp - 4], cx     ; *(c{1}: int*2B) = store %t{13}: int2B
      mov dx, [bp - 2]
      add dx, word [bp - 4]     ; %t{16}: int2B = %t{14}: int2B plus %t{15}: int2B
      sub ax, cx                ; %t{19}: int2B = %t{9}: int2B minus %t{13}: int2B
      imul dx, ax               ; %t{20}: int2B = %t{16}: int2B mul %t{19}: int2B
      mov word [bp - 6], dx     ; *(sum{0}: int*2B) = store %t{20}: int2B
      mov sp, bp
      pop bp
      ret

      @@_c_0_: dw 1, 2, 3
      @@_c_1_: dw 3
    `);
  });
});
