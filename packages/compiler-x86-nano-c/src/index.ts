import {ccompiler} from './frontend';

ccompiler(
  `
    struct Vec2 {
      float x, y;
    }

    union Register {
      int a;
      char b;
    }

    unsigned float add(const float a, const float b) {
      return a + b;
    }

    int main(int argc, char** argv[]) {
      int array[] = { 1, 2, 3, 4 };
      array[1] = 2;

      if (array[1] > 2) {}
      for (int i = 0; i < 10; ++i) {
        do {
          i--;
        } while (2 > 1);

        if (i > 10) {
          break;
        }
      }

      add(3, 4);
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
