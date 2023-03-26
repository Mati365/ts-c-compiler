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
    jnz @@_L4                 ; br %t{6}: i1:zf, false: L4
    @@_L5:
    mov ax, [bp - 2]
    mov sp, bp
    pop bp
    ret 2
    @@_L4:
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
    mov bx, [bp + 10]         ; %t{10}: const char*2B = load str{1}: const char**2B
    push bx
    call @@_fn_strlen
    mov word [bp - 2], ax     ; *(len{0}: int*2B) = store %t{11}: int2B
    mov bx, [bp + 6]
    imul bx, 80               ; %t{13}: int2B = %t{12}: int2B mul %80: char1B
    add bx, word [bp + 4]     ; %t{15}: int2B = %t{13}: int2B plus %t{14}: int2B
    shl bx, 1                 ; %t{16}: int2B = %t{15}: int2B mul %2: char1B
    mov word [bp - 4], bx     ; *(origin{0}: int*2B) = store %t{16}: int2B
    mov ax, 0xB800
    mov gs, ax
    mov word [bp - 6], 0      ; *(i{0}: int*2B) = store %0: int2B
    @@_L6:
    mov ax, [bp - 2]
    cmp word [bp - 6], ax     ; %t{19}: i1:zf = icmp %t{17}: int2B less_than %t{18}: int2B
    jl @@_L7                  ; br %t{19}: i1:zf, true: L7, false: L8
    jge @@_L8                 ; br %t{19}: i1:zf, true: L7, false: L8
    @@_L7:
    mov bx, [bp + 10]         ; %t{22}: const char*2B = load str{1}: const char**2B
    add bx, word [bp - 6]     ; %t{25}: const char*2B = %t{22}: const char*2B plus %t{23}: int2B
    mov al, [bx]              ; %t{26}: const char1B = load %t{25}: const char*2B
    mov byte [bp - 7], al     ; *(c{0}: const char*2B) = store %t{26}: const char1B
    mov cx, [bp - 6]
    mov dx, cx                ; swap
    shl cx, 1                 ; %t{29}: int2B = %t{23}: int2B mul %2: char1B
    mov di, [bp - 4]
    add di, cx                ; %t{30}: int2B = %t{27}: int2B plus %t{29}: int2B
    mov word [bp - 9], di     ; *(offset{0}: const int*2B) = store %t{30}: int2B
    mov ah, [bp - 7]          ; asm input - c
    mov si, [bp - 9]          ; asm input - offset
    push dx                   ; clobber - dl
    mov dl, byte [bp + 8]
    mov bx, si
    mov byte [gs:bx + 1], dl
    mov byte [gs:bx], ah
    pop dx                    ; clobber - dl
    add dx, 1                 ; %t{21}: int2B = %t{23}: int2B plus %1: int2B
    mov word [bp - 6], dx     ; *(i{0}: int*2B) = store %t{21}: int2B
    jmp @@_L6                 ; jmp L6
    @@_L8:
    mov sp, bp
    pop bp
    ret 8
    ; def main():
    @@_fn_main:
    push bp
    mov bp, sp
    sub sp, 4
    call @@_fn_clear_screen
    mov word [bp - 2], 0      ; *(i{0}: int*2B) = store %0: int2B
    @@_L9:
    cmp word [bp - 2], 15     ; %t{36}: i1:zf = icmp %t{35}: int2B less_than %15: char1B
    jl @@_L10                 ; br %t{36}: i1:zf, true: L10, false: L11
    jge @@_L11                ; br %t{36}: i1:zf, true: L10, false: L11
    @@_L10:
    mov ax, [bp - 2]
    mov bx, ax                ; swap
    add ax, 1                 ; %t{42}: int2B = %t{40}: int2B plus %1: char1B
    mov di, @@_c_0_           ; %t{44}: const char*2B = lea c{0}: const char[13]*2B
    mov word [bp - 4], di     ; *(%t{43}: const char**2B) = store %t{44}: const char*2B
    push word [bp - 4]
    push ax
    push bx
    push 0
    call @@_fn_printf
    mov ax, [bp - 2]
    add ax, 1                 ; %t{38}: int2B = %t{37}: int2B plus %1: int2B
    mov word [bp - 2], ax     ; *(i{0}: int*2B) = store %t{38}: int2B
    jmp @@_L9                 ; jmp L9
    @@_L11:
    mov sp, bp
    pop bp
    ret
    @@_c_0_: db 72, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100, 33, 0
  `);
});
