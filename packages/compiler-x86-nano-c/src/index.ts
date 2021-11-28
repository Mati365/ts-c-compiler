import {ccompiler} from './frontend';

ccompiler(
  /* cpp */ `
    int main(int argc, char** array[]) {
      int dupa = 2;
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
