import {CFunctionDeclType, CType, CVariable} from '../../analyze';
import {CIRFnDefInstruction} from '../instructions';
import {CIRVariable} from '../variables';

const TMP_VAR_PREFIX = 't';

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
    tmpVars: 0,
  };

  isAllocated(variable: string): boolean {
    return !!this.variables[variable];
  }

  genLabelName(suffix: string) {
    return `L${this.counters.labels++}-${suffix}`;
  }

  getVariable(name: string): CIRVariable {
    return this.variables[name];
  }

  /**
   * Just assigns variable by its name to map
   *
   * @param {CIRVariable} variable
   * @return {CIRVariable}
   * @memberof CIRVariableAllocator
   */
  allocVariable(variable: CIRVariable | CVariable): CIRVariable {
    if (variable instanceof CVariable)
      variable = CIRVariable.ofScopeVariable(variable);

    this.variables[variable.prefix] = variable;
    return variable;
  }

  /**
   * Decrenebt syffix and return var
   *
   * @return {CIRVariable}
   * @memberof CIRVariableAllocator
   */
  deallocTmpVariable(): CIRVariable {
    return this.allocVariable(
      this
        .getVariable(TMP_VAR_PREFIX)
        .ofDecrementedSuffix(),
    );
  }

  /**
   * Alloc variable used for example for ptr compute
   *
   * @param {CType} type
   * @return {{CIRVariable}
   * @memberof CIRVariableAllocator
   */
  allocTmpVariable(type: CType): CIRVariable {
    const tmpVar = this.getVariable(TMP_VAR_PREFIX) ?? new CIRVariable(
      {
        prefix: TMP_VAR_PREFIX,
        suffix: -1,
        type,
      },
    );

    return this.allocVariable(
      tmpVar.ofIncrementedSuffix(),
    );
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
