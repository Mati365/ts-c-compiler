// todo1: Add ASM reg globbing
// todo2: Add ternary
// todo3: Add switch
// todo4: Add global variables
export const MOCK_C_FILE = /* c */ `
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
    int len = 14;
    int origin = (y * 80 + x) * 2;

    asm(
      "push ax\n"
      "mov ax, 0xB800\n"
      "mov gs, ax\n"
      "pop ax\n"
    );

    for (int i = 0; i < len; ++i) {
      const char c = str[i];
      const int offset = origin + i * 2;

      asm(
        "push dx\n"
        "push bx\n"
        "mov dl, %[color]\n"
        "mov bx, %[offset]\n"
        "mov byte [gs:bx + 1], dl\n"
        "mov byte [gs:bx], %[c]\n"
        "pop bx\n"
        "pop dx"
        :: [c] "r" (c), [offset] "r" (offset), [color] "m" (color)
      );
    }
  }

  void main() {
    clear_screen();

    for (int i = 0; i < 0xf; ++i) {
      printf(0, i, i + 1, "Hello world!");
    }
  }
`;
