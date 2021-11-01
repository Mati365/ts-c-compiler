import {ccompiler} from './frontend';

ccompiler(
  null,
  `
    const int abccc = 3 > 4 >> 1 && 5 < 2;
  `,
).match(
  {
    ok: (result) => result.dump(),
    err: (error) => {
      console.error(error);
    },
  },
);
