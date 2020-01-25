export const setBit = (nth, value, num) => (
  value
    ? (num | (1 << nth))
    : (num & ~(1 << nth))
);

export const toggleBit = (nth, num) => num ^ (1 << nth);

export const getBit = (nth, value) => (value >> nth) & 0x1;

export const isSetBit = (nth, value) => getBit(nth, value) === 1;

export const hasFlag = (flag, value) => (value & flag) === flag;

export const removeFlag = (flag, value) => value & (~flag);
