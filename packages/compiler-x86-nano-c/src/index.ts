import {ccompiler} from './frontend';

ccompiler(
  null,
  `
    struct ABC {}

    inline int main() {
      short abc = 2;
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
