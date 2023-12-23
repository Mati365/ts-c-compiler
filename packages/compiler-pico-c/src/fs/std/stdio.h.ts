export const STD_IO_CONTENT_HEADER = /* c */ `
#ifndef STDIO_H
#define STDIO_H

  #include <kernel.h>
  #include <stdarg.h>

  #define true 1
  #define false 0
  #define NULL 0

  void putchar(const char c) {
    kernel_putc(0xF, c);
  }

  void print_unsigned_number(unsigned int n) {
    int div = 1;
    int len = 0;
    unsigned int num = n;

    for (; num / div > 9; ) {
      div *= 10;
    }

    for (; div != 0; ) {
      putchar('0' + num / div);

      len++;
      num %= div;
      div /= 10;
    }
  }

  int printf(const char* str, ...) {
    va_list ap;
    va_start(ap, str);

    int offset = 0;
    char currentChar;

    do {
      const char nextChar = str[offset + 1];

      currentChar = str[offset];
      offset++;

      if (currentChar == '%' && nextChar != '\0') {
        switch (nextChar) {
          case 'd':
            print_unsigned_number(va_arg(ap, int));
          break;
        }

        offset++;
        continue;
      }

      if (currentChar == '\0') {
        break;
      }

      putchar(currentChar);
    } while(true);

    va_end(ap);
    return 0;
  }

#endif
`;
