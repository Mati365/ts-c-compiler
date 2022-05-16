import {IsPrintable} from '@compiler/core/interfaces';

/**
 * Single register variable
 *
 * @export
 * @class CIRVariable
 * @implements {IsPrintable}
 */
export class CIRVariable implements IsPrintable {
  constructor(
    readonly name: string,
    readonly byteSize: number,
  ) {}

  getDisplayName(): string {
    const {name, byteSize} = this;

    return `${name}:b${byteSize}`;
  }
}
