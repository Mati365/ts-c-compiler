import {ccompiler} from './frontend';

ccompiler(
  null,
  `
    enum Size {
      SMALL = 1,
      BIG = 2,
      LARGE = 3,
    };

    enum Size2 {
      SMALL,
      BIG = 2,
      LARGE,
    }

    enum {
      XD = 1
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
