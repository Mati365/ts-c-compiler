import {CCompilerConfig} from '@compiler/pico-c/constants';
import {CFunctionDeclType, CPointerType, CPrimitiveType, CType, CVariable} from '../../analyze';
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

  constructor(
    readonly config: CCompilerConfig,
  ) {}

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
   * Allocates pointer to variable
   *
   * @param {IRVariable} variable
   * @return {IRVariable}
   * @memberof IRVariableAllocator
   */
  allocVariablePointer(variable: IRVariable | CVariable): IRVariable {
    const {arch} = this.config;
    if (variable instanceof CVariable)
      variable = IRVariable.ofScopeVariable(variable);

    const mappedVariable = variable.map(
      (value) => ({
        ...value,
        type: CPointerType.ofType(arch, value.type),
      }),
    );

    return this.allocVariable(mappedVariable);
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
        volatile: true,
        suffix: -1,
        prefix,
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
   * Define variable to LEA output
   *
   * @param {string} [prefix=TMP_VAR_PREFIX]
   * @return {IRVariable}
   * @memberof IRVariableAllocator
   */
  allocAddressVariable(prefix: string = TMP_VAR_PREFIX): IRVariable {
    const {arch} = this.config;

    return this.allocTmpVariable(
      CPointerType.ofType(
        arch,
        CPrimitiveType.address(arch),
      ),
      prefix,
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
      (arg) => this.allocVariablePointer(IRVariable.ofScopeVariable(arg)),
    );

    return new IRFnDefInstruction(
      fn.name,
      irDefArgs,
    );
  }
}
