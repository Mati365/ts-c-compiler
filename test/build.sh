#!/bin/sh
rm -rf build/
mkdir build/
nasm -f bin ./asm/bootsec.asm -o ./build/bootsec.bin
