import {ccompiler} from './frontend';

ccompiler(
  null,
  `
    const int abccc = 3 > 2 ? 2 + 2 : 1 + 1;
  `,
).match(
  {
    ok: (result) => result.dump(),
    err: (error) => {
      console.error(error);
    },
  },
);
