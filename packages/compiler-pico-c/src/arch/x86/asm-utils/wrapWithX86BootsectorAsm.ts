import { unsafeAsmBinary } from '@ts-c-compiler/x86-assembler';

export const getX86BootsectorPreloaderBinary = () =>
  unsafeAsmBinary()(/* asm */ `
  [org 0x7c00]
  jmp 0x0000:initialize_mbr

  initialize_mbr:
    mov ax, 0x2000 ; 0x2000:0x0000
    mov es, ax
    mov ds, ax
    mov fs, ax
    mov ss, ax
    xor bx, bx ; bx == 0

    mov ah, 2  ; read sectors into memory
    mov al, 0xff  ; 1337 stage2  3 * 512
    mov ch, 0
    mov cl, 2  ; sectors start from 1, or so they say ;)
    mov dh, 0
    int 13h

    finit
    jmp word 0x2000:0x0000
    hlt

  times 510 - ($ - $$) db 0
  dw 0xaa55
`);

export const wrapWithX86BootsectorAsm = (code: string) => `
  [org 0x0]
  mov sp, 0xFFFF
  call @@_fn_main
  hlt

  ${code}
`;
