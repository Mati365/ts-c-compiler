// todo1: Add switch
// todo2: Add ternary
// todo4: Add global variables
// todo5: Fix calling fn with copy of struct
export const MOCK_C_FILE = /* c */ `
  void main() {
    int a = 2;
    int b;

    switch (a) {
      case 3:
      b = 6;
      break;

      case 4:
      b = 7;
      break;

      default:
      b = 8;
    }
  }
`;
