import {ccompiler} from './frontend';

ccompiler(
  null,
  `
    const int abccc;
  `,
).match(
  {
    ok: (result) => result.dump(),
    err: (error) => {
      console.error(error);
    },
  },
);
