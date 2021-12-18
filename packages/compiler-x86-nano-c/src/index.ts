import {ccompiler} from './frontend';

ccompiler(
  /* cpp */ `
    enum ABC {
        A = 1 + 2
    };

    struct Vec {
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
