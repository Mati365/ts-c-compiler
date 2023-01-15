import { X86_REGISTER_NAMES } from '../constants/x86';
import { X86RegName } from '../parts';

export const isIntegerX86Reg = (reg: X86RegName) =>
  X86_REGISTER_NAMES.includes(reg);
