import { genInstruction } from '../../asm-utils';

export function compileRetInstruction() {
  return [genInstruction('ret')];
}
