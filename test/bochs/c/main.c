extern void put_c(char);

void main() {
  put_c('D'); put_c('U'); put_c('P'); put_c('A');
  asm "hlt";
}

void put_c(char c) {
  asm "mov ah, #0x0e";
  asm "mov bx, sp";
  asm "mov al, [bx + 2]";
  asm "mov bl, #0x0c";
  asm "int 0x10";
}