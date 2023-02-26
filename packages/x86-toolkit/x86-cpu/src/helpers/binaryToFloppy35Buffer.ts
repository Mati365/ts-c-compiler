import { Buffer } from 'buffer';

const FLOPPY35_BYTE_SIZE = 1474560;

/**
 * Converts array of numbers to floppy image
 */
export function binaryToFloppy35Buffer(binary: number[]): Buffer {
  const buffer = Buffer.alloc(FLOPPY35_BYTE_SIZE);
  Buffer.from(binary).copy(buffer, 0, 0, binary.length);

  return buffer;
}
