import {ccompiler} from './frontend';

ccompiler(
  /* cpp */ `
    inline extern const int main(int x, int y) {
      return x + y;
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
