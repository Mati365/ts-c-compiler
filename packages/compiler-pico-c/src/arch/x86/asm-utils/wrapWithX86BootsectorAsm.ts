export const wrapWithX86BootsectorAsm = (code: string) => `
  [org 0x7c00]
  jmp 0x0000:initialize_mbr

  initialize_mbr:
    xor ax, ax
    mov ds, ax
    mov es, ax
    mov fs, ax
    call @@_fn_main
    hlt

  ${code}

  times 510 - ($ - $$) db 0
  dw 0xaa55
`;
