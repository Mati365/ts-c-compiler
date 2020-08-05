import CodeMirror from 'codemirror';

function words(str: string): Record<string, boolean> {
  return str.split(' ').reduce(
    (acc, current) => {
      acc[current] = true;
      return acc;
    },
    {},
  );
}

export const NASM_HIGHLIGHT = {
  addressing: words('byte word dword qword tword ptr'),

  conventionalInstructions: words(
    // eslint-disable-next-line max-len
    'aaa aad aam aas adc add and arpl bound bsf bsr bswap bt btc btr bts call cbw cdq clc cld cli clts cmc cmp cmps cmpxchg cwd cwde daa das dec div enter esc hlt idiv imul in inc ins int into invd invlpg iret iretd ja jae jb jbe jc jcxz je jecxz jg jge jl jle jmp jna jnae jnb jnbe jnc jne jng jnge jnl jnle jno jnp jns jnz jo jp jpe jpo js jz lahf lar lds lea leave les lfs lgdt lidt lgs lldt lmsw lock lods loop loope loopz loopnz loopne lsl lss ltr mov movs movsx movzx mul near neg nop not or out outs pop popa popad popf popfd push pusha pushad pushf pushfd rcl rcr rep repe repz repne repnz ret retf rol ror sahf sal sar sbb scas section setae setnb setb setnae setbe setna sete setz setne setnz setl setnge setge setng setle setng setg setnle sets setns setc setnc seto setno setp setpe setnp setpo sgdt sidt shl shld shr shrd sldt smsw stc std sti stos str sub test verr verw wait fwait wait fwait wbinvd xchg xlat xlatb xor equ',
  ),

  specialInstructions: words('db dw dd dq dt do dy dz resb resw resd resq rest reso resy resz'),
  sections: words('section segment .data .text .bss'),

  // x86 and x86_64 registers
  registers: words(
    // eslint-disable-next-line max-len
    'ip eip eax ebx ecx edx edi esi ebp esp ax bx cx dx di si bp sp ah al bh bl ch cl dh dl ax bx cx dx cs ds ss es fs gs cr0 cr2 cr3 db0 db1 db2 db3 db6 db7 tr6 tr7 st rax rcx rdx rbs rsp rbp rsi rdi',
  ),
};

export function nasmSyntaxDefine(): CodeMirror.Mode<any> {
  const {
    conventionalInstructions,
    specialInstructions,
    sections,
    registers,
  } = NASM_HIGHLIGHT;

  // comment style
  const lineCommentStartSymbol = ';';

  return {
    startState() {
      return {
        tokenize: null,
      };
    },

    token(stream, state) {
      if (state.tokenize) {
        return state.tokenize(stream, state);
      }

      let cur = null;
      const ch = stream.next();

      // comment
      if (ch === lineCommentStartSymbol) {
        stream.skipToEnd();
        return 'comment';
      }

      // string style 1
      if (ch === '\'') {
        stream.skipTo('\'');
        return 'string';
      }

      // string style 2
      if (ch === '"') {
        stream.eatWhile(/\w/);
        return 'string';
      }

      if (ch === '.') {
        stream.eatWhile(/\w/);
        cur = stream.current().toLowerCase();
        if (Object.prototype.propertyIsEnumerable.call(sections, cur))
          return 'tag';
      }

      // macro
      if (ch === '%') {
        stream.eatWhile(/\w/);
        return 'tag';
      }

      // decimal and hexadecimal numbers
      if (/\d/.test(ch)) {
        if (ch === '0' && stream.eat('x')) {
          stream.eatWhile(/[0-9a-fA-F]/);
          return 'number';
        }
        stream.eatWhile(/\d/);
        return 'number';
      }

      // labels and sections/segments
      if (/\w/.test(ch)) {
        stream.eatWhile(/\w/);
        if (stream.eat(':'))
          return 'tag';

        cur = stream.current().toLowerCase();
        if (Object.prototype.propertyIsEnumerable.call(sections, cur))
          return 'tag';
      }

      if (Object.prototype.propertyIsEnumerable.call(conventionalInstructions, cur)) {
        stream.eatWhile(/\w/);
        return 'keyword';
      }

      if (Object.prototype.propertyIsEnumerable.call(specialInstructions, cur)) {
        stream.eatWhile(/\w/);
        return 'tag';
      }

      if (Object.prototype.propertyIsEnumerable.call(registers, cur)) {
        stream.eatWhile(/\w/);
        return 'builtin';
      }

      return null;
    },

    lineComment: lineCommentStartSymbol,
  };
}
