import {ccompiler} from './frontend';

ccompiler(
  /* cpp */ `
    struct Dupa {
      int dupa;
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
