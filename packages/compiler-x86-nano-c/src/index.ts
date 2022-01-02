import {ccompiler} from './frontend';

ccompiler(
  /* cpp */ `
    int main() {
      int x, y = 0;
      double z;

      x = 5;
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
