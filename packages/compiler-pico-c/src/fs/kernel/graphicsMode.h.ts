export const GRAPHICS_MODE_HEADER = /* c */ `
#ifndef GRAPHICS_MODE_H
#define GRAPHICS_MODE_H

  #define GRAPH_VRAM_ADDR 0xA000
  #define GRAPH_SCREEN_WIDTH 320
  #define GRAPH_SCREEN_HEIGHT 200

  #define GRAPH_GREEN_COLOR 48
  #define GRAPH_RED_COLOR 40
  #define GRAPH_BLUE_COLOR 32
  #define GRAPH_BLACK_COLOR 0
  #define GRAPH_WHITE_COLOR 15

  void kernel_graph_init() {
    asm(
      "mov ax, 0x13\n"
      "int 10h\n"
      ::: "ax"
    );
  }

  void kernel_graph_put_pixel(int x, int y, char color) {
    int offset = y * GRAPH_SCREEN_WIDTH + x;

    asm(
      "mov bx, %[vram]\n"
      "mov gs, bx\n"
      "mov bx, %[offset]\n"
      "mov dl, %[color]\n"
      "mov byte [gs:bx], dl\n"
      ::
        [vram] "r" (GRAPH_VRAM_ADDR),
        [offset] "m" (offset),
        [color] "m" (color)
      : "dx", "bx", "gs"
    );
  }

  void kernel_graph_draw_rect(int x, int y, int w, int h, char color) {
    const int end_x_offset = x + w;
    const int end_y_offset = y + h;

    for (int i = x; i <= end_x_offset; ++i) {
      kernel_graph_put_pixel(i, y, color);
      kernel_graph_put_pixel(i, end_y_offset, color);
    }

    for (int i = y; i <= end_y_offset; ++i) {
      kernel_graph_put_pixel(x, i, color);
      kernel_graph_put_pixel(end_x_offset, i, color);
    }
  }

  void kernel_graph_fill_rect(int x, int y, int w, int h, char color) {
    const int end_x_offset = x + w;
    const int end_y_offset = y + h;

    for (int offset_x = x; offset_x <= end_x_offset; ++offset_x) {
      for (int offset_y = y; offset_y <= end_y_offset; ++offset_y) {
        kernel_graph_put_pixel(offset_x, offset_y, color);
      }
    }
  }
#endif
`;
