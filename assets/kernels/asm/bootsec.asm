%macro mount_interrupt 2
  ; %1 - code
  ; %2 - handler
  mov ax, %1
  mov bx, 4
  imul bx
  mov bx, ax

  xor cx, cx
  mov es, cx

  mov word [es:bx], %2
  mov word [es:bx + 0x2], cs
%endmacro

; MAIN
xchg bx, bx
jmp 0x7C0:main
main:
  sti
  ; mount_interrupt 0x0, div_by_zero_handler
  ; mount_interrupt 0x1, debugger_hit
  mount_interrupt 0x6, invalid_opcode
  nop
  nop
  dw 0xFF0F
  hlt

; div_by_zero_handler:
;   xchg bx, bx
;   iret

; debugger_hit:
;   xchg dx, dx
;   iret

invalid_opcode:
  xchg dx, dx
  iret

; At the end we need the boot sector signature.
times 510-($-$$) db 0
  db 0x55
  db 0xaa
