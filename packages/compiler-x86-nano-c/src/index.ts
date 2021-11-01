import {ccompiler} from './frontend';

ccompiler(
  null,
  `
    const int abccc = 1 && 3 || 4 && 5 & 3 || 2 & 5;
  `,
).match(
  {
    ok: (result) => result.dump(),
    err: (error) => {
      console.error(error);
    },
  },
);
