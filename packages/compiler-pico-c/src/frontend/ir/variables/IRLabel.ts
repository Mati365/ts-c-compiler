import chalk from 'chalk';

import { IsPrintable } from '@ts-c-compiler/core';
import { Identity } from '@ts-c-compiler/core';

export function isIRLabel(obj: any): obj is IRLabel {
  return !!obj?.value?.name;
}

export type IRLabelDescriptor = {
  name: string;
};

export class IRLabel
  extends Identity<IRLabelDescriptor>
  implements IsPrintable
{
  static ofName(name: string) {
    return new IRLabel({
      name,
    });
  }

  get name() {
    return this.value.name;
  }

  getDisplayName(): string {
    return `${chalk.yellowBright('label-offset')} ${this.name}`;
  }
}
