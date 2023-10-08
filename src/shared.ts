// todo: Add ternary
// todo: Fix calling fn with copy of struct
export const MOCK_C_FILE = /* c */ `
  void main() {
    int k = 4;
    int s = 10;

    int d1 = -2;
    int d2 = 11;

    int a = k < s ? d1 + d2 > 10 ? 666 : 4 : 2;
    asm("xchg dx, dx");
  }
`;

// todo (fix allocator exception):
// todo (fix missing load instruction, optimizer issue)
/**
 *
 *     int sum(int x, int y) { return x + y; }
    int main() {
    int (*ptr)(int, int) = sum;
    (*ptr + 1)(1, 2);
    ptr(1, 2);
    (*ptr)(4, 5);
    }
 */
/**
   typedef struct Vec2 {
    int x, y;
  } vec2_t;

  void main() {
    vec2_t a = { .x = 1, .y  = 2};
    vec2_t b = a;

    a.x += 2;
    int k = a.x;
    asm("xchg dx, dx");
  }
 */

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
