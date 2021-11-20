import {ccompiler} from './frontend';

ccompiler(
  null,
  `
    struct ABC {
      _Static_assert(n == 5, "TAK");
    }

    inline int main() {
      if (2 > 3) {
        if (true) {}
      } else {
        int b = 2;
      }
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
