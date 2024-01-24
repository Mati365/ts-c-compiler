import '../utils';

describe('Ternary', () => {
  test('ternary allocator do not release register that is used by previous arg', () => {
    expect(/* cpp */ `
      #include <stdarg.h>

      int strlen(const char* str) {
        for (int i = 0;;++i) {
          if (*(str + i) == 0) {
            return i;
          }
        }

        return -1;
      }

      int prints(const char *str, int a) {
        return strlen(str) + 10;
      }

      int print(const char *str, const char *format) {
        return prints(str, 4 ? 2 : 1);
      }

      int main() {
        int a = print("Hello", "Format");

        asm("xchg bx, bx");
        return 0;
      }
    `).toCompiledAsmBeEqual(`
      cpu 386
      ; def strlen(str{0}: const char**2B): [ret: int2B]
      @@_fn_strlen:
      push bp
      mov bp, sp
      sub sp, 2
      mov word [bp - 2], 0      ; *(i{0}: int*2B) = store %0: int2B
      @@_L1:
      mov bx, [bp + 4]          ; %t{2}: const char*2B = load str{0}: const char**2B
      add bx, word [bp - 2]     ; %t{4}: const char*2B = %t{2}: const char*2B plus %t{3}: int2B
      mov al, [bx]              ; %t{5}: const char1B = load %t{4}: const char*2B
      cmp al, 0                 ; %t{6}: i1:zf = icmp %t{5}: const char1B equal %0: char1B
      jnz @@_L5                 ; br %t{6}: i1:zf, false: L5
      @@_L6:
      mov ax, [bp - 2]
      mov sp, bp
      pop bp
      ret 2
      @@_L5:
      mov ax, [bp - 2]
      add ax, 1                 ; %t{1}: int2B = %t{0}: int2B plus %1: int2B
      mov word [bp - 2], ax     ; *(i{0}: int*2B) = store %t{1}: int2B
      jmp @@_L1                 ; jmp L1
      @@_L3:
      mov ax, word -1
      mov sp, bp
      pop bp
      ret 2
      ; def prints(str{1}: const char**2B, a{0}: int*2B): [ret: int2B]
      @@_fn_prints:
      push bp
      mov bp, sp
      mov bx, [bp + 4]          ; %t{11}: const char*2B = load str{1}: const char**2B
      push bx
      call @@_fn_strlen
      add ax, 10                ; %t{13}: int2B = %t{12}: int2B plus %10: char1B
      mov sp, bp
      pop bp
      ret 4
      ; def print(str{1}: const char**2B, format{0}: const char**2B): [ret: int2B]
      @@_fn_print:
      push bp
      mov bp, sp
      sub sp, 1
      mov bx, [bp + 4]          ; %t{15}: const char*2B = load str{1}: const char**2B
      mov ax, word 4
      cmp ax, 0                 ; %t{17}: i1:zf = icmp %4: char1B differs %0: int2B
      jz @@_L9                  ; br %t{17}: i1:zf, false: L9
      @@_L8:
      mov al, 2                 ; %t{18}: char1B = assign:φ %2: char1B
      jmp @@_L7                 ; jmp L7
      @@_L9:
      mov al, 1                 ; %t{19}: char1B = assign:φ %1: char1B
      @@_L7:
      movzx cx, al
      push cx
      push bx
      call @@_fn_prints
      mov sp, bp
      pop bp
      ret 4
      ; def main(): [ret: int2B]
      @@_fn_main:
      push bp
      mov bp, sp
      sub sp, 2
      mov ax, [@@_c_0_]         ; %t{23}: const char*2B = load %t{22}: const char**2B
      mov bx, [@@_c_1_]         ; %t{25}: const char*2B = load %t{24}: const char**2B
      push bx
      push ax
      call @@_fn_print
      mov word [bp - 2], ax     ; *(a{1}: int*2B) = store %t{26}: int2B
      xchg bx, bx
      mov ax, word 0
      mov sp, bp
      pop bp
      ret
      @@_c_0_:
      dw @@_c_0_@str$0_0
      @@_c_0_@str$0_0: db "Hello", 0x0
      @@_c_1_:
      dw @@_c_1_@str$0_0
      @@_c_1_@str$0_0: db "Format", 0x0
    `);
  });
});
