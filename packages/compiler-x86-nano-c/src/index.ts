import {ccompiler} from './frontend';

ccompiler(
  /* cpp */ `
    struct Rect {
      float w, h;
    };

    struct Vec2 {
      int x, y;
    };

    int dupa(int x, struct Rect rect, struct Vec2 x) {}

    int main() {
      struct Rect rect;
      struct Vec2 vec;

      dupa(rect.w, rect, vec);
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
