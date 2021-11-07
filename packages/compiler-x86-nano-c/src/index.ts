import {ccompiler} from './frontend';

ccompiler(
  null,
  `
    enum Enumek {
      A = 1,
      B,
    };

    void main(int a, double b) {
      if (a > b) {
        return;
      }
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
