import {isNewline} from '@compiler/lexer/utils';

/**
 * Parses C style comments like // or \/* *\/
 *
 * @exports
 * @param {string} code
 * @param {number} offset
 * @param {string} character
 * @returns {number}
 */
export function cComentParser(code: string, offset: number, character: string): number {
  // detect inline C commnet
  if (character === '/' && code[offset + 1] === '/') {
    for (offset += 1; offset < code.length; ++offset) {
      if (isNewline(code[offset + 1]))
        break;
    }
    return offset;
  }

  // detect block C comment
  if (character === '/' && code[offset + 1] === '*') {
    for (offset += 1; offset < code.length; ++offset) {
      if (code[offset] === '*' && code[offset + 1] === '/') {
        offset++;
        break;
      }
    }
    return offset;
  }

  return null;
}
