import {ccompiler} from './frontend';

ccompiler(
  null,
  `
    int abcdef_aaa, kuj;
    float gunwo;

    enum Flagi {
      ABC,
      ABC2 = 2,
      ABC3 = 3
    };
  `,
).match(
  {
    ok: (result) => result.dump(),
    err: (error) => {
      console.error(error);
    },
  },
);
