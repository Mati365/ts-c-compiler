import {ccompiler} from './frontend';

ccompiler(
  /* cpp */ `
    struct Vec2 {
      int x, y;
    };

    int main() {
      // int w[][] = { { 1, 2, 3 }, { 2, 3, 4 }  };
      int w[2][3] = { 1, 2, 3, 4, 5, 6 };
      int c = 2;
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
