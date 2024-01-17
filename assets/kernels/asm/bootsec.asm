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
; def main():
@@_fn_main:
push bp
mov bp, sp
sub sp, 4
fld dword [@@_$LC_0]
fstp dword [bp - 4]
fld dword [bp - 4]
fld dword [@@_$LC_1]
fxch st1
fucomp st1
fnstsw ax
xchg bx, bx
test ah, 19
jz @@_L1                  ; br %t{1}: i1:zf, false: L1
@@_L2:
xchg bx, bx
@@_L1:
mov sp, bp
pop bp
ret
@@_$LC_0: dd 7.0
@@_$LC_1: dd 15.0



  ; BOOTSET

  times 510 - ($ - $$) db 0
  dw 0xaa55
