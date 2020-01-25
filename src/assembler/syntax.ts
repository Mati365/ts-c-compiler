import tagFunction from './utils/tagFunction';

import {
  ast,
  lexer,
} from './parser';

/**
 * Root of evil
 *
 * @param {String} code
 */
const compile = tagFunction((code) => {
  ast(lexer(code));
});

compile`
  mov ax, bx
  mov cx, ah
  int 31h
`;

export default compile;
