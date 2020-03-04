import {tagFunction} from './utils/tagFunction';
import {
  compile,
  ast,
  lexer,
} from './parser';

/**
 * Root of evil
 *
 * @param {String} code
 */
const make = tagFunction(
  (code: string) => compile(ast(lexer(code))),
);

/*
  Best way to test if jmps works ok:
  mov cl, 2
  mov cx, 2
  mov ax, 'ac'
  jmp far [cs:bx+0xFF]
  mov byte al, [bx]
  dupa:
  int 3
  jmp word 0x7C00:0xFF
  jmp far word [cs:bx+0xFFF]
  mov ax, word [es:bx+0x5]
  jmp dupa
  stuff: db 0xFF, 0x75, "abcdefghijktlmneoprste"
  mov ax, bx
*/

/* eslint-disable no-console,@typescript-eslint/no-unused-expressions */
make`
; NASM MBR boot loader
[bits 16]                               ; 16-bit code
[org 0x7c00]                            ; BIOS loads us at 0x07c0:0000
jmp 0x0000:initialize_bios              ; reset code segment to 0x0000 with long jump

initialize_bios:
        xor ax, ax
        mov ds, ax                      ; reset data segments to 0x0000
        mov es, ax
        mov [bootdrive], dl             ; store boot drive
        mov si, welcome                 ; print welcome string
        call print
        ;jmp load_kernel_header         ; proceed to load kernel

halt:
        hlt                             ; halt CPU to save power
        jmp halt                        ; loop if halt interrupted

print:                                  ; Print string in SI with bios
        mov al, [si]
        inc si
        or al, al
        jz exit_function                ; end at NUL
        mov ah, 0x0e                    ; op 0x0e
        mov bh, 0x00                    ; page number
        mov bl, 0x07                    ; color
        int 0x10                        ; INT 10 - BIOS print char
        jmp print
        exit_function:
        ret

data:
        welcome db 'Loading...', 0      ; welcome message
        error db 'Error', 0             ; error message
        bootdrive db 0x00               ; original BIOS boot drive

;times 200 - ($ - $$) db 0               ; should fill to 510 bytes. For demo changed to 200 bytes.
dw 0xaa55                               ; boot signature (fills to 512 bytes)
                                        ;
                                        ; Bootloader by Kenneth Falck
`;
/* eslint-enable no-console,@typescript-eslint/no-unused-expressions */
