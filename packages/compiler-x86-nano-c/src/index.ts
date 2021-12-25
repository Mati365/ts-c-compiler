import {ccompiler} from './frontend';

ccompiler(
  /* cpp */ `
    enum Mode {
      A = 1 + (2 + 3),
      B,
      C = 4
    }

    struct Vec {
      const int x, y;
      unsigned char letters2[10];
      char* (*letters)[5][15];
    };
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
