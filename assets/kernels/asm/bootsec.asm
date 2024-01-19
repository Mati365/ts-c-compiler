cpu 386
[org 0x7c00]
  jmp 0x0000:initialize_mbr

  initialize_mbr:
  finit
  xor ax, ax
  mov ds, ax
  mov es, ax
  mov fs, ax
  call @@_fn_main
  hlt

  ; BOOOTSEC

cpu 386
; def sum(a{0}: int*2B, b{0}: char*2B): [ret: int2B]
@@_fn_sum:
push bp
mov bp, sp
movzx ax, byte [bp + 6]
xchg bx, bx
mov bx, [bp + 4]
add bx, ax                ; %t{3}: int2B = %t{0}: int2B plus %t{2}: int2B
mov ax, bx
mov sp, bp
pop bp
ret 4
; def main():
@@_fn_main:
push bp
mov bp, sp
sub sp, 2
push 97
push 3
call @@_fn_sum
mov word [bp - 2], ax     ; *(k{0}: int*2B) = store %t{5}: int2B
xchg bx, bx
mov sp, bp
pop bp
ret



  ; BOOTSET

  times 510 - ($ - $$) db 0
  dw 0xaa55
