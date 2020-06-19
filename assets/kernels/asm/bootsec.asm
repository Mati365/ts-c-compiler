stack:  equ 0x7700
line:   equ 0x778
sector: equ 0x7800
osbase: equ sector + line + stack * 2
org osbase
mov ax, osbase & 0xFFFF
