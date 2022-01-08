import {ccompiler} from './frontend';

ccompiler(
  /* cpp */ `
    struct Vec2 {
      int x, y;
    };

    int main() {
      struct Vec2 vec;

      int character = (int) vec;
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
