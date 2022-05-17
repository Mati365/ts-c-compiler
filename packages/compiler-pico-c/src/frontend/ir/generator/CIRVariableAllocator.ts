import {CFunctionDeclType} from '../../analyze';
import {CIRFnDefInstruction} from '../instructions';
import {CIRVariable} from '../variables';

/**
 * Registers symbols table
 *
 * @export
 * @class CIRVariableAllocator
 */
export class CIRVariableAllocator {
  private readonly variables: Record<string, CIRVariable> = {};
  private readonly counters = {
    labels: 0,
    variables: 0,
  };

  genLabelName(suffix: string) {
    return `L${this.counters.labels++}-${suffix}`;
  }

  /**
   * Just assigns variable by its name to map
   *
   * @param {CIRVariable} variable
   * @return {CIRVariable}
   * @memberof CIRVariableAllocator
   */
  allocVariable(variable: CIRVariable): CIRVariable {
    this.variables[variable.name] = variable;
    return variable;
  }

  /**
   * Allocates arg temp variables for function
   *
   * @param {CFunctionDeclType} fn
   * @return {CIRFnDefInstruction}
   * @memberof CIRVariableAllocator
   */
  allocFunctionType(fn: CFunctionDeclType): CIRFnDefInstruction {
    const irDefArgs = fn.args.map(
      (arg) => this.allocVariable(CIRVariable.ofScopeVariable(arg)),
    );

    return new CIRFnDefInstruction(
      fn.name,
      irDefArgs,
    );
  }
}
