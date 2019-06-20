import tagFunction from './utils/tagFunction';
import lexer from './lexer';

/**
 * Root of evil
 *
 * @param {String} code
 */
const compile = tagFunction((code) => {
  console.log(lexer(code));
});

compile`
  mov ax, ax
  mov bx, 0x2
`;

export default compile;
