import tagFunction from './utils/tagFunction';
import lexer from './lexer';

/**
 * Root of evil
 *
 * @param {String} code
 */
const compile = tagFunction((code) => {
  const lex = lexer(code);
  for (const keyword of lex) {
    console.log(keyword);
  }
});

export default compile;
