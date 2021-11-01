import {ccompiler} from './frontend';

ccompiler(
  null,
  `
    for (int a; b < 2 + 5;) {}
  `,
).match(
  {
    ok: (result) => result.dump(),
    err: (error) => {
      console.error(error);
    },
  },
);
