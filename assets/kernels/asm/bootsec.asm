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
; def sum(a{0}: float*2B, b{0}: float*2B): [ret: float4B]
@@_fn_sum:
push bp
mov bp, sp
fld dword [bp + 4]
fld dword [bp + 8]
fxch st1
fadd st0, st1
ffree st1
mov sp, bp
pop bp
ret 4
; def main():
@@_fn_main:
push bp
mov bp, sp
sub sp, 12
fld dword [@@_$LC_0]
sub sp, 4
mov bx, sp
fstp dword [bx]
ffree st7
fld1
sub sp, 4
mov bx, sp
fstp dword [bx]
ffree st7
call @@_fn_sum
fst dword [bp - 8]
sub sp, 4
mov bx, sp
fstp dword [bx]
ffree st7
fld1
sub sp, 4
mov bx, sp
fstp dword [bx]
ffree st7
call @@_fn_sum
fst dword [bp - 12]
fstp dword [bp - 4]
ffree st7
xchg bx, bx
mov sp, bp
pop bp
ret
@@_$LC_0: dd 2.0



  ; BOOTSET

  times 510 - ($ - $$) db 0
  dw 0xaa55
