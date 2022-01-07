import {ccompiler} from './frontend';

ccompiler(
  /* cpp */ `
    int sum(int x, int y) {
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
