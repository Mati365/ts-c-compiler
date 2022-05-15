import {IsPrintable} from '@compiler/core/interfaces';

export type CIRVarName = string;

/**
 * Just wrapper for scalar or variable name
 *
 * @export
 * @class CIRInstructionVarArg
 * @implements {IsPrintable}
 */
export class CIRInstructionVarArg implements IsPrintable {
  constructor(
    readonly name: CIRVarName,
    readonly constant?: number,
  ) {}

  getDisplayName(): string {
    return this.name ?? this.constant.toString();
  }

  isConstant() {
    return !this.name;
  }

  static ofName(name: string) {
    return new CIRInstructionVarArg(name);
  }

  static ofConstant(constant: number) {
    return new CIRInstructionVarArg(null, constant);
  }
}
