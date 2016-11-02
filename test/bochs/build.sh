#!/bin/sh
mkdir -p build/
nasm -f bin ./asm/bootsec.asm -o ./build/bootsec.bin
