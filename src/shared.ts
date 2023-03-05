export const MOCK_C_FILE = /* c */ `
  // todo1: Add ASM reg globbing
  // todo2: Add ternary
  // todo3: Add switch
  // todo4: Add global variables
  void main() {
    int a = 1;
    int b = 2;

    asm(
      "add %[out], %[in]"
      : [out] "=r" (a)
      : [in] "r" (b)
    );
  }
`;
