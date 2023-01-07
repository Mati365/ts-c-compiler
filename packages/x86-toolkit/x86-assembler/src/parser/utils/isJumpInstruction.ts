/**
 * Used to detect if instruction wants to consume some bytes,
 * if so - it will popably consume at least 2 imm bytes
 * (due to IP size)
 */
export function isJumpInstruction(opcode: string): boolean {
  return opcode[0] === 'j' || opcode === 'call' || opcode === 'loop';
}
