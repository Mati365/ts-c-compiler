import {ccompiler} from './frontend';

ccompiler(
  null,
  `
    struct Vec2 {
      double x, y;
    }

    void add(float x, float y) {
      return x + y;
    }

    int main() {
      double test, test2 = 2;
      float vec;

      vec[2] = 2;
      sizeof(int);

      if (2 > 1 && 2 < 3) {
        float dupa;
      } else {
        int dupa;
      }

      return 1;
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
