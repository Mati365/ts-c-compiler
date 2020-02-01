import * as R from 'ramda';

const defaultToEmpty = R.defaultTo('');

const indexedReduce = R.addIndex(R.reduce);

export const tagFunction = (fn: (...args: any[]) => any) => (strings: TemplateStringsArray, ...values: any[]) => {
  const template = indexedReduce(
    (prev, string, index) => `${prev}${string}${defaultToEmpty(values[index])}`,
    '',
    strings,
  );

  return fn(template);
};
