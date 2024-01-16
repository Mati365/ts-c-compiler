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
sub sp, 12
fld dword [@@_$LC_0]
fstp dword [bp - 4]
fld dword [bp - 4]
fld dword [@@_$LC_1]
fadd st1, st0
fxch st1
fst dword [bp - 8]
fld dword [bp - 8]
ffree st7
fld dword [bp - 4]
fmul st1, st0
ffree st1
ffree st7
fld dword [@@_$LC_2]
xchg bx, bx
fsub st1, st0
fxch st1
fst dword [bp - 12]
mov sp, bp
pop bp
ret
@@_$LC_0: dd 2.0
@@_$LC_1: dd 63.0
@@_$LC_2: dd 3.0


  ; BOOTSET

  times 510 - ($ - $$) db 0
  dw 0xaa55
