import { identity } from 'ramda';
import { ccompiler } from '@compiler/pico-c';
import { serializeTypedTreeToString } from '@compiler/pico-c/frontend/parser';

import { CompilerOutput, asm } from '@x86-toolkit/assembler';
import { trimLines } from '@compiler/core/utils';

const attachBootSignatureASM = (asmCode: string): string =>
  trimLines(/* s */ `
  [org 0x7c00]
  jmp 0x0000:initialize_mbr

  initialize_mbr:
  xor ax, ax
  mov ds, ax
  mov es, ax
  mov fs, ax
  call @@_fn_main
  hlt

  ${asmCode}

  times 510 - ($ - $$) db 0
  dw 0xaa55
`);

export const compileBootsecC = (code: string) =>
  ccompiler(code)
    .andThen(result => {
      result.codegen.asm = attachBootSignatureASM(result.codegen.asm);
      result.dump();

      return asm(result.codegen.asm);
    })
    .match<CompilerOutput | null>({
      ok: identity,
      err: (error: any) => {
        if (error?.[0]?.tree) {
          console.info(serializeTypedTreeToString(error[0].tree));
        }

        console.error(error);
        return null;
      },
    });
