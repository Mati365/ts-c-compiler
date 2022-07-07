import {EmitterResult} from '../constants/types';

/**
 * Emmits single assembly comment
 *
 * @export
 * @param {string} msg
 * @returns {EmitterResult}
 */
export function genComment(msg: string): EmitterResult {
  return {
    code: `; ${msg}`,
  };
}

/**
 * Adds comment to end of instruction
 *
 * @export
 * @param {EmitterResult} instruction
 * @param {string} msg
 * @returns
 */
export function appendInstructionComment(instruction: EmitterResult, msg: string) {
  return {
    ...instruction,
    code: `${instruction.code} ; ${msg}`,
  };
}
