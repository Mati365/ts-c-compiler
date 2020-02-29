export const extractNthByte = (nth: number, num: number): number => (num >> (nth * 0x8)) & 0xFF;
