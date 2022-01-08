import {ccompiler} from './frontend';

ccompiler(
  /* cpp */ `
    int main() {
      char character = (char) 2;
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
