import {CFunctionDeclType, CType, CVariable} from '../../analyze';
import {IRFnDefInstruction} from '../instructions';
import {IRVariable} from '../variables';

const TMP_VAR_PREFIX = 't';
const CONST_VAR_PREFIX = 'c';

/**
 * Registers symbols table
 *
 * @export
 * @class IRVariableAllocator
 */
export class IRVariableAllocator {
  private readonly variables: Record<string, IRVariable> = {};
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

  getVariable(name: string): IRVariable {
    return this.variables[name];
  }

  /**
   * Just assigns variable by its name to map
   *
   * @param {IRVariable} variable
   * @return {IRVariable}
   * @memberof IRVariableAllocator
   */
  allocVariable(variable: IRVariable | CVariable): IRVariable {
    if (variable instanceof CVariable)
      variable = IRVariable.ofScopeVariable(variable);

    this.variables[variable.prefix] = variable;
    return variable;
  }

  /**
   * Decrenebt syffix and return var
   *
   * @return {IRVariable}
   * @memberof IRVariableAllocator
   */
  deallocTmpVariable(): IRVariable {
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
   * @param {string} [prefix=TMP_VAR_PREFIX]
   * @return {IRVariable}
   * @memberof IRVariableAllocator
   */
  allocTmpVariable(type: CType, prefix: string = TMP_VAR_PREFIX): IRVariable {
    const tmpVar = this.getVariable(prefix) ?? new IRVariable(
      {
        prefix,
        suffix: -1,
        type,
      },
    );

    return this.allocVariable(
      tmpVar
        .ofType(type)
        .ofIncrementedSuffix(),
    );
  }

  /**
   * Alloc variable for data segment
   *
   * @param {CType} type
   * @return {IRVariable}
   * @memberof IRVariableAllocator
   */
  allocConstDataVariable(type: CType): IRVariable {
    return this.allocTmpVariable(type, CONST_VAR_PREFIX);
  }

  /**
   * Allocates arg temp variables for function
   *
   * @param {CFunctionDeclType} fn
   * @return {IRFnDefInstruction}
   * @memberof IRVariableAllocator
   */
  allocFunctionType(fn: CFunctionDeclType): IRFnDefInstruction {
    const irDefArgs = fn.args.map(
      (arg) => this.allocVariable(IRVariable.ofScopeVariable(arg)),
    );

    return new IRFnDefInstruction(
      fn.name,
      irDefArgs,
    );
  }
}
