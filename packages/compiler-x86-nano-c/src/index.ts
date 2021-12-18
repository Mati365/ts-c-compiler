import {ccompiler} from './frontend';

ccompiler(
  /* cpp */ `
    struct Vec2 {};

    struct Dupa {
      struct Vec2 pos;
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
