import { X86RegsStore } from './X86Regs';

export type X86InterruptHandlerCallback = (regs?: X86RegsStore) => void;

export type X86InterruptHandler = {
  physicalAddress: number;
  fn: X86InterruptHandlerCallback;
};

export type X86InterruptsSet = {
  [address: number]: X86InterruptHandler;
};

export enum X86InterruptType {
  FAULT = 0x1,
  TRAP = 0x2,
  ABORT = 0x3,
  INTERRUPT = 0x4,
  SOFTWARE = 0x5,
}

/**
 * @see {@link https://wiki.osdev.org/Exceptions}
 * @see {@link https://chamilo.grenoble-inp.fr/courses/ENSIMAG4MMPCSEF/document/traps.pdf}
 * @see
 *   X86AbstractCPU.interrupt
 */
export class X86Interrupt {
  constructor(
    readonly code: number,
    readonly type: X86InterruptType,
    readonly mnemonic: string,
    readonly errorCode: number = null,
    readonly maskable: boolean = true,
  ) {}

  isTripleFault(): boolean {
    const { code, type, mnemonic } = this;

    return code === null && type === null && mnemonic === null;
  }

  isCPUReserved(code: number): boolean {
    return code >= 0 && code <= 0x1f;
  }

  static raise = {
    divideByZero: () => new X86Interrupt(0x0, X86InterruptType.FAULT, '#DE'),
    debug: (type: X86InterruptType = X86InterruptType.FAULT) =>
      new X86Interrupt(0x1, type, '#DB'),
    nonMaskable: () =>
      new X86Interrupt(0x2, X86InterruptType.INTERRUPT, null, null, false),
    breakpoint: () => new X86Interrupt(0x3, X86InterruptType.TRAP, '#BP'),
    overflow: () => new X86Interrupt(0x4, X86InterruptType.TRAP, '#OF'),
    boundRangeExceeded: () => new X86Interrupt(0x5, X86InterruptType.FAULT, '#BR'),
    invalidOpcode: () => new X86Interrupt(0x6, X86InterruptType.FAULT, '#UD'),
    deviceNotAvailable: () => new X86Interrupt(0x7, X86InterruptType.FAULT, '#NM'),
    doubleFault: (errorCode: number = 0) =>
      new X86Interrupt(0x8, X86InterruptType.ABORT, '#DF', errorCode),
    coprocessorSegmentOverrun: () => new X86Interrupt(0x9, X86InterruptType.FAULT, null),
    invalidTSS: (errorCode: number) =>
      new X86Interrupt(0xa, X86InterruptType.FAULT, '#TS', errorCode),
    segmentNotPresent: (errorCode: number) =>
      new X86Interrupt(0xb, X86InterruptType.FAULT, '#NP', errorCode),
    stackSegmentFault: (errorCode: number) =>
      new X86Interrupt(0xc, X86InterruptType.FAULT, '#SS', errorCode),
    generalProtectionFault: (errorCode: number) =>
      new X86Interrupt(0xd, X86InterruptType.FAULT, '#GP', errorCode),
    pageFault: (errorCode: number) =>
      new X86Interrupt(0xe, X86InterruptType.FAULT, '#PF', errorCode),
    x87FloatingPointException: () =>
      new X86Interrupt(0x10, X86InterruptType.FAULT, '#MF'),
    alignmentCheck: (errorCode: number) =>
      new X86Interrupt(0x11, X86InterruptType.FAULT, '#AC', errorCode),
    machineCheck: () => new X86Interrupt(0x12, X86InterruptType.ABORT, '#MC'),
    SIMDFloatingPointException: () =>
      new X86Interrupt(0x13, X86InterruptType.FAULT, '#XM/#XF'),
    virtualizationException: () => new X86Interrupt(0x14, X86InterruptType.FAULT, '#VE'),
    securityException: (errorCode: number) =>
      new X86Interrupt(0x1e, null, '#SX', errorCode),
    tripleFault: () => new X86Interrupt(null, null, null),
    software: (code: number) =>
      new X86Interrupt(code, X86InterruptType.SOFTWARE, null, null, false),
  };
}
