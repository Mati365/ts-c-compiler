; NASM MBR boot loader
[bits 16]                               ; 16-bit code
[org 0x7c00]                            ; BIOS loads us at 0x07c0:0000
db    'hello',13,10,'$'
