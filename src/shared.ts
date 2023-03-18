// todo1: Add switch
// todo2: Add ternary
// todo4: Add global variables
// todo5: Fix calling fn with copy of struct
export const MOCK_C_FILE = /* c */ `
  int strlen(const char* str) {
    int i = 0;

    for (;;++i) {
      if (*(str + i) == 0) {
        break;
      }

      if (i == 12) {
        continue;
      }
    }

    return i;
  }

  void main() {
    int a = strlen("Hello world!");
    asm("xchg dx, dx");
  }
`;
