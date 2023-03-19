// todo: Add ternary
// todo: Add global variables
// todo: Fix calling fn with copy of struct
export const MOCK_C_FILE = /* c */ `
  const char* HELLO_WORLD = "Hello world!";

  int strlen(const char* str) {
    for (int i = 0;;++i) {
      if (*(str + i) == 0) {
        return i;
      }
    }

    return -1;
  }

  void main() {
    const char* str = HELLO_WORLD;
    int k = strlen(str);
  }
`;
