import {ccompiler} from './frontend';

ccompiler(
  /* cpp */ `
    int sum(int x, int y) {
      return x + y;
    }

    int main() {
      sum(2, 4);
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
