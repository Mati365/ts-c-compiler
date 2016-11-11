extern void put_c(char);

void main() {
  int i = 0;
  {
    int b = 2;
    while(b < 4) {
      b++;
    }
    if(b == 4) {
      asm "xchg bx, bx";
    }
  }
  asm "hlt";
}

void put_c(char c) {
  asm "mov ah, #0x0e";
  asm "mov bx, sp";
  asm "mov al, [bx + 2]";
  asm "mov bl, #0x0c";
  asm "int 0x10";
}