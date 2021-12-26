import {ccompiler} from './frontend';

ccompiler(
  /* cpp */ `
    int sum(int x, int y) {
      int c;
      int d;
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
