import {CScopeTree} from './CScopeTree';
import {CVariable} from './variables/CVariable';
import {ASTCFunctionDefinition} from '../../parser/ast/ASTCFunctionDefinition';
import {CFunctionDeclType} from '../types/function';

/**
 * Special type of C-Scope that also lookups over function args
 *
 * @export
 * @class CFunctionScope
 * @extends {CScopeTree}
 */
export class CFunctionScope extends CScopeTree<ASTCFunctionDefinition> {
  constructor(
    readonly fnType: CFunctionDeclType,
    parentAST: ASTCFunctionDefinition,
    parentScope: CScopeTree = null,
  ) {
    super(parentAST, parentScope);
  }

  override findVariable(name: string): CVariable {
    const fnArg = this.fnType.getArgByName(name);
    if (fnArg)
      return fnArg;

    return super.findVariable(name);
  }
}
