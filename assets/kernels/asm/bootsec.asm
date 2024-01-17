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
sub sp, 8
fld dword [@@_$LC_0]
fstp dword [bp - 4]
fld dword [@@_$LC_1]
fstp dword [bp - 8]
fld dword [bp - 4]
fadd dword [@@_$LC_2]
fld dword [@@_$LC_3]
nop
fxch st1                  ; # Swap with stack top
fucom st1
fnstsw ax
test ah, 5
jne @@_L1                 ; br %t{2}: i1:zf, false: L1
@@_L3:
fld dword [bp - 4]
fld dword [@@_$LC_4]
fucom st1
fnstsw ax
test ah, 69
jne @@_L1                 ; br %t{4}: i1:zf, false: L1
@@_L4:
fld dword [bp - 4]
fld dword [bp - 8]
fxch st1                  ; # Swap with stack top
fadd st0, st1
fld dword [@@_$LC_5]
nop
fxch st1                  ; # Swap with stack top
fucom st1
fnstsw ax
and ah, 69
xor ah, 64
je @@_L2                  ; br %t{8}: i1:zf, true: L2
@@_L5:
fld dword [bp - 4]
fxch st7                  ; # Swap with stack top
fxch st1                  ; # Swap with stack top
fxch st7                  ; # Swap with stack top
ffree st7
fld dword [bp - 8]
fxch st1                  ; # Swap with stack top
fmul st0, st1
ffree st7
fld dword [@@_$LC_6]
xchg bx, bx
ffree st7
fld dword [@@_$LC_6]
xchg bx, bx
fxch st1                  ; # Swap with stack top
xchg bx, bx
fucom st1
fnstsw ax
and ah, 69
xor ah, 64
je @@_L2                  ; br %t{12}: i1:zf, true: L2
jmp @@_L1                 ; jmp L1
jmp @@_L1                 ; jmp L1
jmp @@_L1                 ; jmp L1
@@_L2:
xchg bx, bx
@@_L1:
mov sp, bp
pop bp
ret
@@_$LC_0: dd 7.0
@@_$LC_1: dd 10.0
@@_$LC_2: dd 4.0
@@_$LC_3: dd 8.0
@@_$LC_4: dd 30.0
@@_$LC_5: dd 117.0
@@_$LC_6: dd 66.0



  ; BOOTSET

  times 510 - ($ - $$) db 0
  dw 0xaa55
