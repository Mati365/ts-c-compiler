import {ccompiler} from './frontend';

ccompiler(
  null,
  `
    const int abccc = 2 && 6 || 4 && 3;
    enum Enumerator {
      ABC = 2,
      VAL,
      DUPA = 4,
    }
  `,
).match(
  {
    ok: (result) => result.dump(),
    err: (error) => {
      console.error(error);
    },
  },
);
