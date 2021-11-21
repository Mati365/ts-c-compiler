import {ccompiler} from './frontend';

ccompiler(
  null,
  `
    struct ABC {
      int dupa, abc;
    }

    const float add(const float a, const float b) {
      return a + b;
    }

    int main() {
      const int title[] = { 1 + 2, 2, 3 };

      add(3, 4.5);

      if (2 + 2 > 3 && 3 << 3 > 1) {} else {
        add(4, 5);
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
