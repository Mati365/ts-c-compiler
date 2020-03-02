org 0x0

label:
  .nested:
    mov ax, bx

  .nested2:
    mov bx, ax

  jmp .nested2
