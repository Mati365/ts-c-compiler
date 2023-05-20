// todo: Add ternary
// todo: Fix calling fn with copy of struct
export const MOCK_C_FILE = /* c */ `
  typedef struct Vec2 {
    char x, y;
  } vec2_t;

  void inc(const vec2_t* vec) {
    vec->y++;
  }

  void main() {
    vec2_t v[2] = { { .x =2, .y = 4}, { .x = 1, .y = 5 } };

    inc(&v[1]);

    char k = v[1].y + v[0].y;
    asm("xchg dx, dx");
  }
`;
