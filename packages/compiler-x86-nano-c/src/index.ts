import {ccompiler} from './frontend';

console.info(
  ccompiler(
    null,
    `int main() {
      int a, b;
    }`,
  ).unwrap(),
);
