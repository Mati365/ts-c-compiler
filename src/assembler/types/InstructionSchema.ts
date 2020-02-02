import * as R from 'ramda';

/**
 * Mnemonic notation:
 * mb,mw,md,mq - memory byte, word, double word, quad word
 * rb, rw, rd - register byte, word, double word
 * rmb, rmw - register or memory byte, word
 * ib, iw - immediate byte, word
 * sl, ll - short label, long label
 * mwr, mdr, mqr, mtr - memory word, double word, quad word, ten byte
 *
 * Binary notation:
 * mr - addressing mode byte
 * d0 d1 - displacement
 * i0 i1 - immediate word
 * s0 s1 - short value
 * r0 - relative short displacement to label 'sl' (-128/+127 bytes)
 * r0 r1 - relative long displacement to label 'll' (-32768/+32767 bytes)
 *
 * @see
 * http://www.mathemainzel.info/files/x86asmref.html
 */
export class InstructionSchema {
  public mnemonic: string;
  public argsSchema: string[];
  public binarySchema: string;

  constructor(
    mnemonic: string,
    argsSchema: string|string[],
    binarySchema: string,
  ) {
    this.mnemonic = mnemonic;
    this.binarySchema = binarySchema;
    this.argsSchema = (
      R.is(String, argsSchema)
        ? R.split(' ', <string> argsSchema)
        : <string[]> argsSchema
    );
  }
}
