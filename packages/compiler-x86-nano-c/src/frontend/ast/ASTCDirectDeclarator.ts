import {walkOverFields} from '@compiler/grammar/decorators/walkOverFields';

import {Token} from '@compiler/lexer/tokens';
import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {ASTCCompilerKind, ASTCCompilerNode} from './ASTCCompilerNode';
import {ASTCConstantExpression} from './ASTCConstantExpression';
import {ASTCIdentifiersList} from './ASTCIdentifiersList';
import {ASTCParametersList} from './ASTCParametersList';
import {ASTCDeclarator} from './ASTCDeclarator';

/**
 * Handlers []
 *
 * @export
 * @class ASTCDirectDeclaratorArrayExpression
 * @extends {ASTCCompilerNode}
 */
@walkOverFields(
  {
    fields: [
      'constantExpression',
    ],
  },
)
export class ASTCDirectDeclaratorArrayExpression extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    public readonly constantExpression?: ASTCConstantExpression,
  ) {
    super(ASTCCompilerKind.DirectDeclaratorArrayExpression, loc);
  }
}

/**
 * Handlers ()
 *
 * @export
 * @class ASTCDirectDeclaratorArrayExpression
 * @extends {ASTCCompilerNode}
 */
@walkOverFields(
  {
    fields: [
      'parameterTypeList',
      'identifiersList',
    ],
  },
)
export class ASTCDirectDeclaratorFnExpression extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    public readonly parameterTypeList?: ASTCParametersList,
    public readonly identifiersList?: ASTCIdentifiersList,
  ) {
    super(ASTCCompilerKind.DirectDeclaratorFnExpression, loc);
  }
}

/**
 * @export
 * @class ASTCDeclarator
 * @extends {ASTCCompilerNode}
 */
@walkOverFields(
  {
    fields: [
      'declarator',
      'arrayExpression',
      'fnExpression',
      'directDeclarator',
    ],
  },
)
export class ASTCDirectDeclarator extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    public readonly identifier?: Token<string>,
    public readonly declarator?: ASTCDeclarator,
    public readonly arrayExpression?: ASTCDirectDeclaratorArrayExpression,
    public readonly fnExpression?: ASTCDirectDeclaratorFnExpression,
    public readonly directDeclarator?: ASTCDirectDeclarator,
  ) {
    super(ASTCCompilerKind.DirectDeclarator, loc);
  }

  toString() {
    const {kind, identifier} = this;

    return ASTCCompilerNode.dumpAttributesToString(
      kind,
      {
        identifier: identifier?.text,
      },
    );
  }
}
