import '../utils';

test('Rainbow Hello World', () => {
  expect(/* cpp */ `
    int strlen(const char* str) {
      for (int i = 0;;++i) {
        if (*(str + i) == 0) {
          return i;
        }
      }

      return -1;
    }

    void clear_screen() {
      asm(
        "mov cx, 0x7d0\n"
        "mov ax, 0xF00\n"
        "mov dx, 0xB800\n"
        "mov es, dx\n"
        "xor di, di\n"
        "rep stosw\n"
      );
    }

    void printf(int x, int y, char color, const char* str) {
      int len = strlen(str);
      int origin = (y * 80 + x) * 2;

      asm(
        "mov ax, 0xB800\n"
        "mov gs, ax\n"
        :::"ax"
      );

      for (int i = 0; i < len; ++i) {
        const char c = str[i];
        const int offset = origin + i * 2;

        asm(
          "mov dl, %[color]\n"
          "mov bx, %[offset]\n"
          "mov byte [gs:bx + 1], dl\n"
          "mov byte [gs:bx], %[c]\n"
          :: [c] "r" (c), [offset] "r" (offset), [color] "m" (color)
          : "dl"
        );
      }
    }

    void main() {
      clear_screen();

      for (int i = 0; i < 0xf; ++i) {
        printf(0, i, i + 1, "Hello world!");
      }
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
    ; def clear_screen():
    @@_fn_clear_screen:
    push bp
    mov bp, sp
    mov cx, 0x7d0
    mov ax, 0xF00
    mov dx, 0xB800
    mov es, dx
    xor di, di
    rep stosw
    mov sp, bp
    pop bp
    ret
    ; def printf(x{0}: int*2B, y{0}: int*2B, color{0}: char*2B, str{1}: const char**2B):
    @@_fn_printf:
    push bp
    mov bp, sp
    sub sp, 9
    mov bx, [bp + 10]         ; %t{11}: const char*2B = load str{1}: const char**2B
    push bx
    call @@_fn_strlen
    mov word [bp - 2], ax     ; *(len{0}: int*2B) = store %t{12}: int2B
    mov bx, [bp + 6]
    imul bx, 80               ; %t{14}: int2B = %t{13}: int2B mul %80: char1B
    add bx, word [bp + 4]     ; %t{16}: int2B = %t{14}: int2B plus %t{15}: int2B
    shl bx, 1                 ; %t{17}: int2B = %t{16}: int2B mul %2: char1B
    mov word [bp - 4], bx     ; *(origin{0}: int*2B) = store %t{17}: int2B
    mov ax, 0xB800
    mov gs, ax
    mov word [bp - 6], 0      ; *(i{0}: int*2B) = store %0: int2B
    @@_L7:
    mov ax, [bp - 2]
    cmp word [bp - 6], ax     ; %t{20}: i1:zf = icmp %t{18}: int2B less_than %t{19}: int2B
    jge @@_L9                 ; br %t{20}: i1:zf, false: L9
    @@_L8:
    mov bx, [bp + 10]         ; %t{23}: const char*2B = load str{1}: const char**2B
    add bx, word [bp - 6]     ; %t{26}: const char*2B = %t{23}: const char*2B plus %t{25}: const char*2B
    mov al, [bx]              ; %t{27}: const char1B = load %t{26}: const char*2B
    mov byte [bp - 7], al     ; *(c{0}: const char*2B) = store %t{27}: const char1B
    mov cx, [bp - 6]
    shl cx, 1                 ; %t{30}: int2B = %t{24}: int2B mul %2: char1B
    mov dx, [bp - 4]
    add dx, cx                ; %t{31}: int2B = %t{28}: int2B plus %t{30}: int2B
    mov word [bp - 9], dx     ; *(offset{0}: const int*2B) = store %t{31}: int2B
    mov ah, [bp - 7]          ; asm input - c
    mov di, [bp - 9]          ; asm input - offset
    mov dl, byte [bp + 8]
    mov bx, di
    mov byte [gs:bx + 1], dl
    mov byte [gs:bx], ah
    @@_L10:
    mov ax, [bp - 6]
    add ax, 1                 ; %t{22}: int2B = %t{21}: int2B plus %1: int2B
    mov word [bp - 6], ax     ; *(i{0}: int*2B) = store %t{22}: int2B
    jmp @@_L7                 ; jmp L7
    @@_L9:
    mov sp, bp
    pop bp
    ret 8
    ; def main():
    @@_fn_main:
    push bp
    mov bp, sp
    sub sp, 2
    call @@_fn_clear_screen
    mov word [bp - 2], 0      ; *(i{0}: int*2B) = store %0: int2B
    @@_L11:
    cmp word [bp - 2], 15     ; %t{37}: i1:zf = icmp %t{36}: int2B less_than %15: char1B
    jge @@_L13                ; br %t{37}: i1:zf, false: L13
    @@_L12:
    mov ax, [bp - 2]
    mov bx, ax                ; swap
    add ax, 1                 ; %t{43}: int2B = %t{41}: int2B plus %1: char1B
    mov cx, [@@_c_0_]         ; %t{45}: const char*2B = load %t{44}: const char**2B
    push cx
    push ax
    push bx
    push word 0
    call @@_fn_printf
    @@_L14:
    mov ax, [bp - 2]
    add ax, 1                 ; %t{39}: int2B = %t{38}: int2B plus %1: int2B
    mov word [bp - 2], ax     ; *(i{0}: int*2B) = store %t{39}: int2B
    jmp @@_L11                ; jmp L11
    @@_L13:
    mov sp, bp
    pop bp
    ret
    @@_c_0_:
    dw @@_c_0_@str$0_0
    @@_c_0_@str$0_0: db "Hello world!", 0x0
  `);
});
