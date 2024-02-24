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
; def kernel_graph_init():
@@_fn_kernel_graph_init:
push bp
mov bp, sp
mov ax, 0x13
int 10h
mov sp, bp
pop bp
ret
; def kernel_graph_put_pixel(x{0}: int*2B, y{0}: int*2B, color{0}: char*2B):
@@_fn_kernel_graph_put_pixel:
push bp
mov bp, sp
sub sp, 2
mov ax, [bp + 6]
imul ax, 320              ; %t{1}: int2B = %t{0}: int2B mul %320: int2B
add ax, word [bp + 4]     ; %t{3}: int2B = %t{1}: int2B plus %t{2}: int2B
mov word [bp - 2], ax     ; *(offset{0}: int*2B) = store %t{3}: int2B
mov bx, 40960
mov gs, bx
mov bx, word [bp - 2]
mov dl, byte [bp + 8]
mov byte [gs:bx], dl
mov sp, bp
pop bp
ret 6
; def kernel_graph_draw_rect(x{1}: int*2B, y{1}: int*2B, w{0}: int*2B, h{0}: int*2B, color{1}: char*2B):
@@_fn_kernel_graph_draw_rect:
push bp
mov bp, sp
sub sp, 8
mov ax, [bp + 4]
mov bx, ax                ; swap
add ax, word [bp + 8]     ; %t{8}: int2B = %t{6}: int2B plus %t{7}: int2B
mov word [bp - 2], ax     ; *(end_x_offset{0}: const int*2B) = store %t{8}: int2B
mov cx, [bp + 6]
add cx, word [bp + 10]    ; %t{11}: int2B = %t{9}: int2B plus %t{10}: int2B
mov word [bp - 4], cx     ; *(end_y_offset{0}: const int*2B) = store %t{11}: int2B
mov word [bp - 6], bx     ; *(i{0}: int*2B) = store %t{6}: int2B
@@_L1:
mov ax, [bp - 2]
cmp word [bp - 6], ax     ; %t{15}: i1:zf = icmp %t{13}: int2B less_than %t{14}: const int2B
jge @@_L3                 ; br %t{15}: i1:zf, false: L3
@@_L2:
movzx ax, byte [bp + 12]
push ax
push word [bp + 6]
push word [bp - 6]
call @@_fn_kernel_graph_put_pixel
movzx ax, byte [bp + 12]
push ax
push word [bp - 4]
push word [bp - 6]
call @@_fn_kernel_graph_put_pixel
@@_L4:
mov ax, [bp - 6]
add ax, 1                 ; %t{17}: int2B = %t{16}: int2B plus %1: int2B
mov word [bp - 6], ax     ; *(i{0}: int*2B) = store %t{17}: int2B
jmp @@_L1                 ; jmp L1
@@_L3:
mov ax, [bp + 6]
mov word [bp - 8], ax     ; *(i{0}: int*2B) = store %t{28}: int2B
@@_L5:
mov ax, [bp - 4]
cmp word [bp - 8], ax     ; %t{31}: i1:zf = icmp %t{29}: int2B less_than %t{30}: const int2B
jge @@_L7                 ; br %t{31}: i1:zf, false: L7
@@_L6:
movzx ax, byte [bp + 12]
push ax
push word [bp - 8]
push word [bp + 4]
call @@_fn_kernel_graph_put_pixel
movzx ax, byte [bp + 12]
push ax
push word [bp - 8]
push word [bp - 2]
call @@_fn_kernel_graph_put_pixel
@@_L8:
mov ax, [bp - 8]
add ax, 1                 ; %t{33}: int2B = %t{32}: int2B plus %1: int2B
mov word [bp - 8], ax     ; *(i{0}: int*2B) = store %t{33}: int2B
jmp @@_L5                 ; jmp L5
@@_L7:
mov sp, bp
pop bp
ret 10
; def main(): [ret: int2B]
@@_fn_main:
push bp
mov bp, sp
call @@_fn_kernel_graph_init
push word 50
push word 1
push word 239
push word 210
push word 60
call @@_fn_kernel_graph_draw_rect
@@_L9:
jmp @@_L9                 ; jmp L9
@@_L11:
mov ax, word 0
mov sp, bp
pop bp
ret

  ; BOOTSET

  times 510 - ($ - $$) db 0
  dw 0xaa55
