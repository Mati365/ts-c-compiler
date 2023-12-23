export const STRING_CONTENT_HEADER = /* c */ `
#ifndef STRING_H
#define STRING_H

  int strlen(const char* str) {
    for (int i = 0;;++i) {
      if (*(str + i) == 0) {
        return i;
      }
    }

    return -1;
  }

#endif
`;
