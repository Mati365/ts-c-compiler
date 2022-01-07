import {ccompiler} from './frontend';

ccompiler(
  /* cpp */ `
    struct Vec2 {
      int x, y;
    };

    void print() {
      return;
    }

    int sum(int x, int y) {
      float z = 2.0;

      return 2 + 3 + x;
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
