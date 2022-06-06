import {IsPrintable} from '@compiler/core/interfaces';
import {IROpcode} from '../constants';

/**
 * Basic IR block, contains mini operations similar to assembly
 *
 * @export
 * @abstract
 * @class IRInstruction
 * @implements {IsPrintable}
 */
export abstract class IRInstruction implements IsPrintable {
  constructor(
    readonly opcode: IROpcode,
  ) {}

  abstract getDisplayName(): string;
}
