import {ccompiler} from './frontend';

ccompiler(
  /* cpp */ `
    struct Vec2D {
      int x, y;
    };

    const int main(int argc, const char *argv[]) {
      return x + y;
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
