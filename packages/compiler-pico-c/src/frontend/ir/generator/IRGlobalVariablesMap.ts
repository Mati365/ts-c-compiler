import { IRVariable } from '../variables';

export class IRGlobalVariablesMap {
  private readonly globals: Record<string, IRVariable> = {};

  put(name: string, variable: IRVariable) {
    this.globals[name] = variable;
  }
}
