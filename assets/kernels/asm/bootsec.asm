org 0x7c00


define arg1 [bp + 4h]
define arg2 [bp + 6h]
define arg3 [bp + 8h]
define arg4 [bp + 10h]

macro stdcall proc, [arg] {
  reverse push arg
  common call proc
}

; ładuje funkcję przesłaniającą przerwanie
;
; interrupt_index - indeks przerwania
; fn_address - adres funkcji, która obsługiwać przerwanie będzie
; backup_fn_address - adres fukcji zapisującej poprzednie przerwanie
macro load_interrupt_handler interrupt_index, fn_address {
  pusha
  cli
  xor ax,ax
  mov es,ax
  les bx,[es:(interrupt_index shl 2)]

  ; wczytanie segmentu wskazującego na 0 adres
  mov es, ax
  mov word [es:(interrupt_index shl 2)], fn_address
  mov word [es:(interrupt_index shl 2) + 2], cs
  sti
  popa
}

load_interrupt_handler 9h, fuk_interrupt_handler
int 9h
mov ah, [ds:ax + bx * 4]
xchg bx, bx

sysSuspend:
  cli
  hlt
  jmp sysSuspend

; przerwanie 9h PIC
fuk_interrupt_handler:
  pusha
  popa
  iret

backup_fuk_int dd ?

times 510-($-$$) db 0
dw 0xaa55
