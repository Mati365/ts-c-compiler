org 0x0

innylabel:
  aaa
  hlt

jakislabel:
  mov ax, bx
  inc bx
  jmp 0x7C00:0x000
  jmp innylabel

call innylabel
jmp far [cs:bx+0xFF]
mov ax, 'ac'
int 3
stuff: db 0xFF, 0x75, "abcdefghijktlmneoprste"
