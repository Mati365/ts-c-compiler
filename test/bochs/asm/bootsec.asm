; NASM breakpoint
; xchg bx, bx
[bits 16]
[org 0x7c00]

jmp word 0x0000:boot

boot:
  mov ax, 0x0
  mov ss, ax
  mov si, ax

  push word 0x2
  push word 0x5
  push word 0x10
  call add_numbers

  xchg bx, bx

add_numbers:
  push bp
  mov bp, sp
  mov ax, [bp + 4]
  add ax, [bp + 6]
  add ax, [bp + 8]
  call add_ax
  pop bp
  ret 6

add_ax:
  inc ax
  ret

times 510 - ($-$$) db 0
dw 0xAA55
