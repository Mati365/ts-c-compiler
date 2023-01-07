import * as R from 'ramda';

const defaultToEmpty = R.defaultTo('');

const indexedReduce = R.addIndex(R.reduce);

export const tagFunction =
  <T>(fn: (template: string) => T) =>
  (strings: TemplateStringsArray, ...values: any[]) => {
    const template = <string>(
      indexedReduce(
        (prev, string, index) =>
          `${prev}${string}${defaultToEmpty(values[index])}`,
        '',
        strings,
      )
    );

    return fn(template);
  };
