import {ccompiler} from './frontend';

ccompiler(
  null,
  `
    int abc(int nargs, ...) {
      int a = 2;
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
