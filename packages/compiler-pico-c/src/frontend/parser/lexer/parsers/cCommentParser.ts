import { isNewline } from '@ts-c/lexer';

/**
 * Parses C style comments like // or \/* *\/
 */
export function cComentParser(
  code: string,
  offset: number,
  character: string,
): number {
  // detect inline C commnet
  if (character === '/' && code[offset + 1] === '/') {
    for (offset += 1; offset < code.length; ++offset) {
      if (isNewline(code[offset + 1])) {
        break;
      }
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
