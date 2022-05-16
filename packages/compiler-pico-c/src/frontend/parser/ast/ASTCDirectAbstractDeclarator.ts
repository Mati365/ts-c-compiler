import {walkOverFields} from '@compiler/grammar/decorators/walkOverFields';

import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {ASTCCompilerKind, ASTCCompilerNode} from './ASTCCompilerNode';
import {ASTCAbstractDeclarator} from './ASTCAbstractDeclarator';
import {ASTCParametersList} from './ASTCParametersList';
import {ASTCAssignmentExpression} from './ASTCAssignmentExpression';
import {ASTCTypeQualifiersList} from './ASTCTypeQualifiersList';
import {ASTCDirectDeclaratorArrayExpression} from './ASTCDirectDeclarator';

/**
 * Handlers []
 *
 * @export
 * @class DirectAbstractDeclaratorArrayExpression
 * @extends {ASTCCompilerNode}
 */
export class ASTCDirectAbstractDeclaratorArrayExpression extends ASTCDirectDeclaratorArrayExpression {
  constructor(
    loc: NodeLocation,
    star?: boolean,
    typeQualifiersList?: ASTCTypeQualifiersList,
    assignmentExpression?: ASTCAssignmentExpression,
  ) {
    super(
      loc, star,
      typeQualifiersList, assignmentExpression,
      ASTCCompilerKind.DirectAbstractDeclaratorArrayExpression,
    );
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
    readonly abstractDeclarator?: ASTCAbstractDeclarator,
    readonly parameterTypeList?: ASTCParametersList,
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
      'directAbstractDeclarator',
      'arrayExpression',
      'fnExpression',
    ],
  },
)
export class ASTCDirectAbstractDeclarator extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    readonly arrayExpression?: ASTCDirectAbstractDeclaratorArrayExpression,
    readonly fnExpression?: ASTCDirectAbstractDeclaratorFnExpression,
    readonly directAbstractDeclarator?: ASTCDirectAbstractDeclarator,
  ) {
    super(ASTCCompilerKind.DirectAbstractDeclarator, loc);
  }
}
