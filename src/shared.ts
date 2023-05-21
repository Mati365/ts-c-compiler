// todo: Add ternary
// todo: Fix calling fn with copy of struct
export const MOCK_C_FILE = /* c */ `
  typedef struct Vec2 {
    int x, y;
  } vec2_t;

  void main() {
    vec2_t a = { .x = 1, .y  = 2};
    vec2_t b = { .x = 4 };
  }
`;

// todo (and ternary):
/**
  typedef struct Vec2 {
    int x, y;
  } vec2_t;

  void main() {
    vec2_t v, a;

    a = (struct Vec2) { .x = 5 };
  }
  */
