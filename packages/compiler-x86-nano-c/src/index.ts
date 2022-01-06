import {ccompiler} from './frontend';

ccompiler(
  /* cpp */ `
    struct Vec2 {
      int x, y;
    } screen;

    float sum(int x, int y) {
      return x + y;
    }

    int main() {
      screen.x = 2;

      float sum = 2.0 * sum(5 + 5);
    }
  `,
).match(
  {
    ok: (result) => {
      result.dump();
    },
    err: (error) => {
      console.error(error);
    },
  },
);
