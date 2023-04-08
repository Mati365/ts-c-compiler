// todo: Peephole optimization in global variables
// todo: Add ternary
// todo: Fix calling fn with copy of struct
export const MOCK_C_FILE = /* c */ `
  struct Vec2 {
    char x, y;
  };

  void inc(const struct Vec2* vec) {
    vec->y++;
  }

  void main() {
    struct Vec2 v[2] = { { .x =2, .y = 4}, { .x = 1, .y = 5 } };

    inc(&v[1]);

    char k = v[1].y + v[0].y;
    asm("xchg dx, dx");
  }
`;
/*
  const char* VRAM_ADDR = 0xB800;
  const char* KERNEL_INIT_MESSAGES[] = {
    "┣Hello world!",
    "Peppa pig!",
    "Another cool title!"
  };

  struct Vec2 {
    int x, y;
  };

  struct Vec2 kernel_screen_cursor = {
    .x = 0,
    .y = 0,
  };

  int strlen(const char* str) {
    for (int i = 0;;++i) {
      if (*(str + i) == 0) {
        return i;
      }
    }

    return -1;
  }

  void kernel_screen_clear() {
    asm(
      "mov cx, 0x7d0\n"
      "mov ax, 0xF00\n"
      "mov dx, 0xB800\n"
      "mov es, dx\n"
      "xor di, di\n"
      "rep stosw\n"
    );
  }

  void kernel_print_char(int x, int y, char color, char c) {
    const int origin = (y * 80 + x) * 2;
    const char dee = c;

    asm(
      "mov gs, %[vram]\n"
      "mov dl, %[color]\n"
      "mov bx, %[offset]\n"
      "mov byte [gs:bx + 1], dl\n"
      "mov byte [gs:bx], %[c]\n"
      :: [vram] "r" (VRAM_ADDR), [c] "r" (c), [offset] "r" (origin), [color] "m" (color)
      : "dl", "bx", "gs"
    );
  }

  void kernel_screen_print_at(int x, int y, char color, const char* str) {
    int len = strlen(str);
    int origin = (y * 80 + x) * 2;

    asm(
      "mov gs, %[vram]\n"
      :: [vram] "r" (VRAM_ADDR)
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

  void kernel_screen_println(char color, const char* str) {
    kernel_screen_print_at(
      kernel_screen_cursor.x,
      kernel_screen_cursor.y,
      color,
      str,
    );

    kernel_screen_cursor.x = 0;
    kernel_screen_cursor.y++;
  }

  void main() {
    kernel_screen_clear();
    kernel_print_char(0, 0, 0x2, 'A');
    kernel_print_char(1, 0, 0x2, 'A');
    kernel_print_char(2, 0, 0x2, 'A');

    // for (int i = 1; i < 0xF; ++i) {
    //   kernel_screen_println(i + 1, KERNEL_INIT_MESSAGES[i % 3]);
    // }
  }
*/

/*
  const char* VRAM_ADDR = 0xB800;
  const char* KERNEL_INIT_MESSAGES[] = {
    "┣Hello world!",
    "Peppa pig!",
    "Another cool title!"
  };

  struct Vec2 {
    int x, y;
  };

  struct Vec2 kernel_screen_cursor = {
    .x = 0,
    .y = 0,
  };

  void kernel_screen_clear() {
    asm(
      "mov cx, 0x7d0\n"
      "mov ax, 0xF00\n"
      "mov dx, 0xB800\n"
      "mov es, dx\n"
      "xor di, di\n"
      "rep stosw\n"
    );
  }

  void kernel_print_char(int x, int y, char color, char letter) {
    const int offset = (y * 80 + x) * 2;

    asm(
      "mov gs, %[vram]\n"
      "mov dl, %[color]\n"
      "mov dh, %[letter]\n"
      "mov bx, %[offset]\n"
      "mov byte [gs:bx + 1], dl\n"
      "mov byte [gs:bx], dh\n"
      ::
        [vram] "r" (VRAM_ADDR),
        [offset] "m" (offset),
        [letter] "m" (letter),
        [color] "m" (color)
      : "dx", "bx", "gs"
    );
  }

  void main() {
    kernel_screen_clear();
    kernel_print_char(0, 0, 0x2, 'A');
    kernel_print_char(1, 0, 0x2, 'B');
    kernel_print_char(2, 0, 0x2, 'C');

    for (int i = 1; i < 0xF; ++i) {
      kernel_screen_println(i + 1, KERNEL_INIT_MESSAGES[i % 3]);
    }
  }
*/
