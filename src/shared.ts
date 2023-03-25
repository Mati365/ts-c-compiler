// todo: Add resolve as label (see "read array ptr to variable", there should not be `mov`)
// todo: Peephole optimization in global variables
// todo: Add ternary
// todo: Fix calling fn with copy of struct
export const MOCK_C_FILE = /* c */ `
  const char* HELLO_WORLD = "Hello world!";

  int strlen(const char* str) {
    return -1;
  }

  void main() {
    const char* str = HELLO_WORLD;
    int k = strlen(str);
  }
`;
