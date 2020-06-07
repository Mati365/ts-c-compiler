use16       ; 16-bit mode

org 0x7C00 ; address of the boot sector

int 12h
jmp DisplayModeInstance13h
xor ax, ax
DisplayModeInstance13h:
  abc

TIMES 510 - ($ - $$) db 0 ;Fill the rest of sector with 0
DW 0xAA55 ;Add boot signature at the end of bootloader
