import {ccompiler} from './frontend';

ccompiler(
  /* cpp */ `
    struct Rect {
      float w, h;

      struct Vec2 {
        int x, y;
      } vec;
    };

    struct OtherRect {
      float w;
    };

    int main() {
      struct Rect rect;
      struct OtherRect rect_b;

      rect = rect_b;

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
