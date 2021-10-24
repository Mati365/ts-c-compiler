import {walkOverFields} from '@compiler/grammar/decorators/walkOverFields';

import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {ASTCCompilerKind, ASTCCompilerNode} from './ASTCCompilerNode';
import {ASTCConstantExpression} from './ASTCConstantExpression';
import {ASTCParametersTypedList} from './ASTCParametersTypedList';

/**
 * Handlers []
 *
 * @export
 * @class DirectAbstractDeclaratorArrayExpression
 * @extends {ASTCCompilerNode}
 */
@walkOverFields(
  {
    fields: [
      'constantExpression',
    ],
  },
)
export class ASTCDirectAbstractDeclaratorArrayExpression extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    public readonly constantExpression?: ASTCConstantExpression,
  ) {
    super(ASTCCompilerKind.DirectAbstractDeclaratorArrayExpression, loc);
  }
}

/**
 * Handlers ()
 *
 * @export
 * @class DirectAbstractDeclaratorFnExpression
 * @extends {ASTCCompilerNode}
 */
@walkOverFields(
  {
    fields: [
      'abstractDeclarator',
      'parameterTypeList',
    ],
  },
)
export class ASTCDirectAbstractDeclaratorFnExpression extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    public readonly abstractDeclarator?: ASTCDirectAbstractDeclarator,
    public readonly parameterTypeList?: ASTCParametersTypedList,
  ) {
    super(ASTCCompilerKind.DirectAbstractDeclaratorFnExpression, loc);
  }
}

/**
 * @export
 * @class ASTCDirectAbstractDeclarator
 * @extends {ASTCCompilerNode}
 */
@walkOverFields(
  {
    fields: [
      'directDeclarator',
      'arrayExpression',
      'fnExpression',
    ],
  },
)
export class ASTCDirectAbstractDeclarator extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    public readonly directDeclarator?: ASTCDirectAbstractDeclaratorFnExpression,
    public readonly arrayExpression?: ASTCDirectAbstractDeclaratorArrayExpression,
    public readonly fnExpression?: ASTCDirectAbstractDeclaratorFnExpression,
  ) {
    super(ASTCCompilerKind.DirectAbstractDeclarator, loc);
  }
}
