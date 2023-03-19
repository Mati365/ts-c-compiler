import { IRVariable } from '../variables';

export class IRGlobalVariablesMap {
  private readonly globals: Record<string, IRVariable> = {};

  putVariable(name: string, variable: IRVariable) {
    this.globals[name] = variable;
  }

  getVariable(name: string) {
    return this.globals[name];
  }
}
