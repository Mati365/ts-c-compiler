import {ccompiler} from './frontend';

ccompiler(
  /* cpp */ `
    int variable[5][6][7];
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
