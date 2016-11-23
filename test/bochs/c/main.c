#define bool char
#define true 1
#define false 0

extern void put_c(char);

static int a[] = { 1, 2, 3, 4 };

void main() {
  a[0] = 2;
  asm "hlt";
}