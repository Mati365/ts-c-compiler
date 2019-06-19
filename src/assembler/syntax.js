const code = `
  mov ax, ax
  inc ax
  dec ax
  xor ax, ax
`;

export const TOKEN_TYPES = {
  REGISTER: 'REGISTER',
  INSTRUCTION: 'INSTRUCTION',
  ADDRESS: 'ADDRESS',
  LABEL: 'LABEL',
};

export const REGISTERS = {
  1: {},
};

export default code;
