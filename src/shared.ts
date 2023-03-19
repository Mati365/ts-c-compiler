// todo: Add ternary
// todo: Add global variables
// todo: Fix calling fn with copy of struct
export const MOCK_C_FILE = /* c */ `
  int j[] = { 1, 2, 3 };
  int s = 3;

  void main() {
    j[2] *= s;

    int k = j[2] + 2;
    int c = j[2] - 2;
    int sum = (k + c) * (k - c);
  }
`;
