/**
 * Used to detect if instruction is from X87, generally prefixed with F
 *
 * @export
 * @param {string} opcode
 * @returns {boolean}
 */
export function isX87Instruction(opcode: string): boolean {
  return opcode[0] === 'f';
}
