import {ccompiler} from './frontend';

ccompiler(
  null,
  `
    const int abccc = 3 + 4 - 6;
  `,
).match(
  {
    ok: (result) => result.dump(),
    err: (error) => {
      console.error(error);
    },
  },
);
