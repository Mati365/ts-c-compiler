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
      mov ax, [@@_c_0_]         ; %t{1}: int2B = load %t{0}: int*2B
      mov word [bp - 2], ax     ; *(k{0}: int*2B) = store %t{1}: int2B
      mov sp, bp
      pop bp
      ret
      @@_c_0_:
      db 0, 0
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
      @@_c_0_:
      db 0, 0
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
      add ax, 2                 ; %t{1}: int[3]*2B = %t{0}: int[3]*2B plus %2: int2B
      mov di, ax
      mov ax, [di]              ; %t{2}: int2B = load %t{1}: int[3]*2B
      mov word [bp - 2], ax     ; *(k{0}: int*2B) = store %t{2}: int2B
      add bx, 2                 ; %t{4}: int[3]*2B = %t{0}: int[3]*2B plus %2: int2B
      mov word [bx], 2          ; *(%t{4}: int[3]*2B) = store %2: char1B
      mov sp, bp
      pop bp
      ret
      @@_c_0_:
      db 0, 0, 0, 0, 0, 0
      @@_c_1_:
      db 0, 0
    `);
  });

  test('read array ptr to variable', () => {
    expect(/* cpp */ `
      const int[] arr = { 1, 2, 3 };

      void main() {
        int* c = arr;
      }
    `).toCompiledAsmBeEqual(`
      cpu 386
      ; def main():
      @@_fn_main:
      push bp
      mov bp, sp
      sub sp, 2
      mov ax, @@_c_0_
      mov word [bp - 2], ax     ; *(c{1}: int**2B) = store %t{0}: const int[3]*2B
      mov sp, bp
      pop bp
      ret
      @@_c_0_:
      dw 1, 2, 3
    `);
  });

  test('array of string literal pointers', () => {
    expect(/* cpp */ `
      const char* as[] = { "SDASD" };
      void main() {
        char a = as[0][1];
      }
    `).toCompiledAsmBeEqual(`
      cpu 386
      ; def main():
      @@_fn_main:
      push bp
      mov bp, sp
      sub sp, 1
      mov ax, [@@_c_0_]         ; %t{2}: const char*[1]2B = load %t{1}: const char*[1]*2B
      add ax, 1                 ; %t{3}: const char**2B = %t{2}: const char*[1]2B plus %1: int2B
      mov bx, ax
      mov al, [bx]              ; %t{4}: const char1B = load %t{3}: const char**2B
      mov byte [bp - 1], al     ; *(a{0}: char*2B) = store %t{4}: const char1B
      mov sp, bp
      pop bp
      ret
      @@_c_0_:
      dw @@_c_0_@str$0_0
      @@_c_0_@str$0_0: db "SDASD", 0x0
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
      add ax, 4                 ; %t{1}: int[3]*2B = %t{0}: int[3]*2B plus %4: int2B
      mov cx, [@@_c_1_]         ; %t{3}: int2B = load %t{2}: int*2B
      mov di, ax
      mov ax, [di]              ; %t{4}: int[3]6B = load %t{1}: int[3]*2B
      imul ax, cx               ; %t{5}: int[3]6B = %t{4}: int[3]6B mul %t{3}: int2B
      mov word [di], ax         ; *(%t{1}: int[3]*2B) = store %t{5}: int[3]6B
      mov dx, bx                ; swap
      add bx, 4                 ; %t{7}: int[3]*2B = %t{0}: int[3]*2B plus %4: int2B
      mov ax, [bx]              ; %t{8}: int2B = load %t{7}: int[3]*2B
      add ax, 2                 ; %t{9}: int2B = %t{8}: int2B plus %2: char1B
      mov word [bp - 2], ax     ; *(k{0}: int*2B) = store %t{9}: int2B
      add dx, 4                 ; %t{11}: int[3]*2B = %t{0}: int[3]*2B plus %4: int2B
      mov di, dx
      mov cx, [di]              ; %t{12}: int2B = load %t{11}: int[3]*2B
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
      @@_c_0_:
      dw 1, 2, 3
      @@_c_1_:
      dw 3
    `);
  });

  test('assign implicit ptr to variable and strlen', () => {
    expect(/* cpp */ `
      const char* HELLO_WORLD = "Hello world!";

      int strlen(const char* str) {
        return -1;
      }

      void main() {
        const char* str = HELLO_WORLD;
        int k = strlen(str);
      }
    `).toCompiledAsmBeEqual(`
      cpu 386
      ; def strlen(str{0}: const char**2B): [ret: int2B]
      @@_fn_strlen:
      push bp
      mov bp, sp
      mov ax, word -1
      mov sp, bp
      pop bp
      ret 2
      ; def main():
      @@_fn_main:
      push bp
      mov bp, sp
      sub sp, 4
      mov ax, @@_c_0_
      mov word [bp - 2], ax     ; *(str{1}: const char**2B) = store %t{2}: const char**2B
      mov bx, [bp - 2]          ; %t{4}: const char*2B = load str{1}: const char**2B
      push bx
      call @@_fn_strlen
      mov word [bp - 4], ax     ; *(k{0}: int*2B) = store %t{5}: int2B
      mov sp, bp
      pop bp
      ret
      @@_c_0_:
      db "Hello world!", 0x0
    `);
  });

  test('increment global array with struct', () => {
    expect(/* cpp */ `
      struct Vec2 { int x, y; };
      struct Vec2 arr[] = { { .x = 1, .y = 2 }, { .x = 3, .y = 4 }};
      void main() {
        arr[0].x++;
      }
    `).toCompiledAsmBeEqual(`
      cpu 386
      ; def main():
      @@_fn_main:
      push bp
      mov bp, sp
      mov ax, [@@_c_0_]         ; %t{2}: int2B = load %t{1}: int*2B
      add ax, 1                 ; %t{3}: int2B = %t{2}: int2B plus %1: int2B
      mov word [@@_c_0_], ax    ; *(%t{1}: int*2B) = store %t{3}: int2B
      mov sp, bp
      pop bp
      ret
      @@_c_0_:
      dw 1, 2, 3, 4
    `);
  });

  test('initialize pointer with constant variable', () => {
    expect(/* cpp */ `
      const char* VRAM_ADDR = (char*) 0xB800;
      const char ptr[] = { 1, 2 };

      void main() {
        char* ptr2 = VRAM_ADDR;
      }
    `).toCompiledAsmBeEqual(`
      cpu 386
      ; def main():
      @@_fn_main:
      push bp
      mov bp, sp
      sub sp, 2
      mov ax, [@@_c_0_]         ; %t{1}: const char*2B = load %t{0}: const char**2B
      mov word [bp - 2], ax     ; *(ptr2{0}: char**2B) = store %t{1}: const char*2B
      mov sp, bp
      pop bp
      ret
      @@_c_0_:
      dw 47104
      @@_c_1_:
      db 1, 2
    `);
  });

  test('initialize with asm tag', () => {
    expect(/* cpp */ `
      const char* VRAM_ADDR = (char*) 0xB800;

      void main() {
        asm(
          "mov gs, %[vram]\n"
          :: [vram] "r" (VRAM_ADDR)
          :"ax"
        );
      }
    `).toCompiledAsmBeEqual(`
      cpu 386
      ; def main():
      @@_fn_main:
      push bp
      mov bp, sp
      mov ax, [@@_c_0_]         ; %t{1}: const char*2B = load %t{0}: const char**2B
      mov gs, ax
      mov sp, bp
      pop bp
      ret
      @@_c_0_:
      dw 47104
    `);
  });

  test('array of strings', () => {
    expect(/* cpp */ `
      const char* HELLO_WORLD = "Hello world!";
      const char HELLO_WORLD2[] = "Hello world2!";
      const char* HELLO_WORLD3[] = { "Hello world3!" }; // incorrect result

      int strlen(const char* str) {
        return -1;
      }

      void main() {
        int length = strlen(HELLO_WORLD);
        int length2 = strlen(HELLO_WORLD2);
      }
    `).toCompiledAsmBeEqual(`
      cpu 386
      ; def strlen(str{0}: const char**2B): [ret: int2B]
      @@_fn_strlen:
      push bp
      mov bp, sp
      mov ax, word -1
      mov sp, bp
      pop bp
      ret 2
      ; def main():
      @@_fn_main:
      push bp
      mov bp, sp
      sub sp, 4
      push @@_c_0_
      call @@_fn_strlen
      mov word [bp - 2], ax     ; *(length{0}: int*2B) = store %t{4}: int2B
      push @@_c_1_
      call @@_fn_strlen
      mov word [bp - 4], ax     ; *(length2{0}: int*2B) = store %t{7}: int2B
      mov sp, bp
      pop bp
      ret
      @@_c_0_:
      db "Hello world!", 0x0
      @@_c_1_:
      db "Hello world2!", 0x0
      @@_c_2_:
      dw @@_c_2_@str$0_0
      @@_c_2_@str$0_0: db "Hello world3!", 0x0
    `);
  });

  test('array of characters with 0 offset', () => {
    expect(/* cpp */ `
      const char as[] = "SDASD";

      void main() {
        char a = as[0];
      }
    `).toCompiledAsmBeEqual(`
      cpu 386
      ; def main():
      @@_fn_main:
      push bp
      mov bp, sp
      sub sp, 1
      mov al, [@@_c_0_]         ; %t{2}: const char1B = load %t{1}: const char[6]*2B
      mov byte [bp - 1], al     ; *(a{0}: char*2B) = store %t{2}: const char1B
      mov sp, bp
      pop bp
      ret
      @@_c_0_:
      db "SDASD", 0x0
    `);
  });

  test('array of characters with 1 offset', () => {
    expect(/* cpp */ `
      const char as[] = "SDASD";

      void main() {
        char a = as[1];
      }
    `).toCompiledAsmBeEqual(`
        cpu 386
        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        sub sp, 1
        mov ax, @@_c_0_
        add ax, 1                 ; %t{1}: const char[6]*2B = %t{0}: const char[6]*2B plus %1: int2B
        mov bx, ax
        mov al, [bx]              ; %t{2}: const char1B = load %t{1}: const char[6]*2B
        mov byte [bp - 1], al     ; *(a{0}: char*2B) = store %t{2}: const char1B
        mov sp, bp
        pop bp
        ret
        @@_c_0_:
        db "SDASD", 0x0
    `);
  });

  test('increment array struct field', () => {
    expect(/* cpp */ `
      struct Vec2 { int x, y; };
      struct Vec2 arr[] = { { .x = 1, .y = 2 }, { .x = 3, .y = 4 }};
      const char* ptr[] = { "Hello", "World" };

      void main() {
        arr[0].x++;

        int k = arr[0].x;
      }
    `).toCompiledAsmBeEqual(`
      cpu 386
      ; def main():
      @@_fn_main:
      push bp
      mov bp, sp
      sub sp, 2
      mov ax, [@@_c_0_]         ; %t{2}: int2B = load %t{1}: int*2B
      add ax, 1                 ; %t{3}: int2B = %t{2}: int2B plus %1: int2B
      mov word [@@_c_0_], ax    ; *(%t{1}: int*2B) = store %t{3}: int2B
      mov bx, [@@_c_0_]         ; %t{6}: int2B = load %t{5}: int*2B
      mov word [bp - 2], bx     ; *(k{0}: int*2B) = store %t{6}: int2B
      mov sp, bp
      pop bp
      ret
      @@_c_0_:
      dw 1, 2, 3, 4
      @@_c_1_:
      dw @@_c_1_@str$0_0
      dw @@_c_1_@str$0_1
      @@_c_1_@str$0_0: db "Hello", 0x0
      @@_c_1_@str$0_1: db "World", 0x0
    `);
  });

  test('array struct field nr 1 += 7', () => {
    expect(/* cpp */ `
      struct Vec2 { int x, y; };
      struct Vec2 arr[] = { { .x = 1, .y = 2 }, { .x = 3, .y = 4 }};
      const char* ptr[] = { "Hello", "World" };

      void main() {
        arr[1].x += 7;

        int k = arr[1].x;
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
      add ax, 4                 ; %t{1}: struct Vec2[2]*2B = %t{0}: struct Vec2[2]*2B plus %4: int2B
      mov di, ax
      mov ax, [di]              ; %t{2}: int2B = load %t{1}: int*2B
      add ax, 7                 ; %t{3}: int2B = %t{2}: int2B plus %7: char1B
      mov word [di], ax         ; *(%t{1}: int*2B) = store %t{3}: int2B
      add bx, 4                 ; %t{5}: struct Vec2[2]*2B = %t{0}: struct Vec2[2]*2B plus %4: int2B
      mov cx, [bx]              ; %t{6}: int2B = load %t{5}: int*2B
      mov word [bp - 2], cx     ; *(k{0}: int*2B) = store %t{6}: int2B
      mov sp, bp
      pop bp
      ret
      @@_c_0_:
      dw 1, 2, 3, 4
      @@_c_1_:
      dw @@_c_1_@str$0_0
      dw @@_c_1_@str$0_1
      @@_c_1_@str$0_0: db "Hello", 0x0
      @@_c_1_@str$0_1: db "World", 0x0
    `);
  });

  test('copy global structures', () => {
    expect(/* cpp */ `
      struct Vec2 { int x, y; };
      struct Vec2 vec = { .x = 4, .y = 3 };
      int main() {
        struct Vec2 vec2 = vec;
      }
    `).toCompiledAsmBeEqual(`
      cpu 386
      ; def main(): [ret: int2B]
      @@_fn_main:
      push bp
      mov bp, sp
      sub sp, 4
      ; memcpy %t{0}: struct Vec2*2B -> vec2{0}: struct Vec2*2B
      mov bx, @@_c_0_
      lea di, [bp - 4]
      ; offset = 0B
      mov ax, word [bx]
      mov word [di], ax
      ; offset = 2B
      mov ax, word [bx + 2]
      mov word [di + 2], ax
      mov sp, bp
      pop bp
      ret

      @@_c_0_:
      dw 4, 3
    `);
  });
});
