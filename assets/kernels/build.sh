#!/bin/sh
mkdir -p build/
nasm -f bin -o ./build/bootsec.bin ./asm/bootsec.asm
objdump -D -b binary -mi386 -M intel -Maddr16,data16 ./build/bootsec.bin
