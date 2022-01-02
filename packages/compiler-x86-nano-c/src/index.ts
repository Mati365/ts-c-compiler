import {ccompiler} from './frontend';

ccompiler(
  /* cpp */ `
    struct Rect {
      float w, h;

      struct Vec2 {
        int x, y;
      } vec;
    };

    int main() {
      struct Rect rect;

      rect.vec.x = 2;

      return 0;
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
