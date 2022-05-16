import {IsPrintable} from '@compiler/core/interfaces';
import {CIROpcode} from '../constants';

/**
 * Basic IR block, contains mini operations similar to assembly
 *
 * @export
 * @abstract
 * @class CIRInstruction
 * @implements {IsPrintable}
 */
export abstract class CIRInstruction implements IsPrintable {
  constructor(
    readonly opcode: CIROpcode,
  ) {}

  abstract getDisplayName(): string;
}
