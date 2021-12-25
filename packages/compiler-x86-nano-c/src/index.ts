import {ccompiler} from './frontend';

ccompiler(
  /* cpp */ `
    struct Vec2 {
      int xyz;
      int b;
    }

    enum Flags {
      A = 1 + 2 + 3,
      B = 2,
      A = 4,
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
