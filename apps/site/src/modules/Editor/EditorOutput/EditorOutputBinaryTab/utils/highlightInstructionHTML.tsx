import * as R from 'ramda';

import { NASM_HIGHLIGHT } from 'modules/Editor/EditorInput/syntax';

/**
 * Highlight blob instruction
 *
 * @see
 *  Assumes that first keyord is mnemonic!
 */
export function highlightInstructionHTML(line: string): string {
  const args = line.split(' ').map((keyword, index) => {
    const testKeyword = index && (R.endsWith(',', keyword) ? R.init(keyword) : keyword);

    let className = null;
    if (!index) {
      className = 'text-purple-600';
    } else if (NASM_HIGHLIGHT.registers[testKeyword]) {
      className = 'text-blue-600';
    } else if (NASM_HIGHLIGHT.addressing[testKeyword]) {
      className = 'text-black';
    } else {
      className = 'text-green-600';
    }

    return `<span class="${className}">${keyword}</span>`;
  });

  return args.join(' ');
}
