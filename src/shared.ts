// todo: Add ternary
// todo: Add global variables
// todo: Fix calling fn with copy of struct
export const MOCK_C_FILE = /* c */ `
  struct Vec2 {
    int x, y;
  };

  struct Vec2 arr[] = { { .x = 1, .y = 2 }, { .x = 3, .y = 4 }};

  void main() {
    arr[0].x++;
    arr[1].x++;
  }
`;
