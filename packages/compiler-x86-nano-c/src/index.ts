import {ccompiler} from './frontend';

ccompiler(
  null,
  `
    int main() {
      const char* title = "Hello world";
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
