import {ccompiler} from './frontend';

ccompiler(
  null,
  `
    inline int main() {
    }
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
