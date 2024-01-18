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
sub sp, 18
mov word [bp - 2], 4      ; *(nbofterms{0}: int*2B) = store %4: int2B
fld dword [@@_$LC_0]
fstp dword [bp - 6]
mov word [bp - 8], 0      ; *(n{0}: int*2B) = store %0: int2B
@@_L1:
mov ax, [bp - 2]
cmp word [bp - 8], ax     ; %t{2}: i1:zf = icmp %t{0}: int2B less_than %t{1}: int2B
jl @@_L2                  ; br %t{2}: i1:zf, true: L2, false: L3
jge @@_L3                 ; br %t{2}: i1:zf, true: L2, false: L3
@@_L2:
mov ax, [bp - 8]
mov bx, ax                ; swap
shl ax, 1                 ; %t{6}: int2B = %t{5}: int2B mul %2: char1B
add ax, 1                 ; %t{7}: int2B = %t{6}: int2B plus %1: char1B
mov word [bp - 14], ax
fild word [bp - 14]
fld1
fdiv st0, st1
fst dword [bp - 12]
mov ax, bx
mov bx, word 2
cdq
idiv bx                   ; %t{10}: int2B = %t{5}: int2B mod %2: char1B
cmp dx, 1                 ; %t{11}: i1:zf = icmp %t{10}: int2B equal %1: char1B
jnz @@_L4                 ; br %t{11}: i1:zf, false: L4
@@_L5:
fld dword [bp - 12]
fmul dword [@@_$LC_1]
fst dword [bp - 12]
@@_L4:
fld dword [bp - 6]
fld dword [bp - 12]
fxch st1
fadd st0, st1
fst dword [bp - 6]
mov ax, [bp - 8]
add ax, 1                 ; %t{4}: int2B = %t{3}: int2B plus %1: int2B
mov word [bp - 8], ax     ; *(n{0}: int*2B) = store %t{4}: int2B
jmp @@_L1                 ; jmp L1
@@_L3:
fld dword [bp - 6]
fmul dword [@@_$LC_2]
fst dword [bp - 18]
xchg bx, bx
mov sp, bp
pop bp
ret
@@_$LC_0: dd 0.0
@@_$LC_1: dd -1.0
@@_$LC_2: dd 4.0



  ; BOOTSET

  times 510 - ($ - $$) db 0
  dw 0xaa55
