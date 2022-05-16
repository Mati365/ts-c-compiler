import {IsPrintable} from '@compiler/core/interfaces';

/**
 * Just wrapper for scalar or variable name
 *
 * @export
 * @class CIRInstructionVarArg
 * @implements {IsPrintable}
 */
export class CIRInstructionVarArg implements IsPrintable {
  constructor(
    readonly name: string,
    readonly constant?: number,
  ) {}

  getDisplayName(): string {
    return this.name ?? this.constant.toString();
  }

  isConstant() {
    return !this.name;
  }
}
