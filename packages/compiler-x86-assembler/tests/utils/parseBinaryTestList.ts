import * as R from 'ramda';

export type BinaryTest = {
  bin: string,
  test: string,
  code: string,
};

/**
 * Creates list of binary asm codes to be tested
 *
 * @export
 * @param {string} str
 * @returns {BinaryTest[]}
 */
export function parseBinaryTestList(str: string): BinaryTest[] {
  const truncated = R.compose(
    R.reject(R.isEmpty),
    R.split('\n'),
  )(str);

  return R.reduce(
    (tests, line) => {
      const prevTest = R.last(tests);
      if (line.indexOf(';=') === 0) {
        const colonIndex = line.indexOf(':');
        const [name, value] = [
          line.substr(3, colonIndex - 3),
          R.trim(line.substr(colonIndex + 1)),
        ];

        if (!prevTest || prevTest.code) {
          tests.push(
            <BinaryTest> {
              bin: '',
              test: '',
              code: '',
              [name]: value,
            },
          );
        } else
          prevTest[name] = value;
      } else if (prevTest)
        prevTest.code += `${line}\n`;

      return tests;
    },
    [],
    truncated,
  );
}
