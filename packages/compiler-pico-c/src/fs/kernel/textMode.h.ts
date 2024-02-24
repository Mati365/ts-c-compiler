export const TEXT_MODE_HEADER = /* c */ `
#ifndef TEXT_MODE_H
#define TEXT_MODE_H

  #include <string.h>

  const char* VRAM_ADDR = (const char*) 0xB800;

  typedef struct ScreenPos {
    int x, y;
  } screen_pos_t;

  screen_pos_t kernel_screen_cursor = {
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

  void kernel_putc(char color, char c) {
    int x = kernel_screen_cursor.x;
    int y = kernel_screen_cursor.y;

    if (c == '\n') {
      kernel_screen_cursor.x = 0;
      kernel_screen_cursor.y++;
      return;
    }

    kernel_screen_cursor.x++;

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
        [letter] "m" (c),
        [color] "m" (color)
      : "dx", "bx", "gs"
    );
  }

  void kernel_screen_newline() {
    kernel_screen_cursor.x = 0;
    kernel_screen_cursor.y++;
  }

#endif
`;
