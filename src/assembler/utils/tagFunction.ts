import * as R from 'ramda';

const defaultToEmpty = R.defaultTo('');

const indexedReduce = R.addIndex(R.reduce);

const tagFunction = fn => (strings, ...values) => {
  const template = indexedReduce(
    (prev, string, index) => `${prev}${string}${defaultToEmpty(values[index])}`,
    '',
    strings,
  );

  return fn(template);
};

export default tagFunction;
