import {ccompiler} from './frontend';

ccompiler(
  null,
  `
    const int abccc = 4 + 12 / 2 - 1 << 11 & 1;
  `,
).match(
  {
    ok: (result) => result.dump(),
    err: (error) => {
      console.error(error);
    },
  },
);
