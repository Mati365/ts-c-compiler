import {ccompiler} from './frontend';

ccompiler(
  /* cpp */ `
    int main() {
      char d;
      d = 2.5;
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
