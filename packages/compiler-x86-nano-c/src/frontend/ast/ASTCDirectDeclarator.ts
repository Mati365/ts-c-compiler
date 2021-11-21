import {walkOverFields} from '@compiler/grammar/decorators/walkOverFields';

import {Token} from '@compiler/lexer/tokens';
import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {ASTCCompilerKind, ASTCCompilerNode} from './ASTCCompilerNode';
import {ASTCIdentifiersList} from './ASTCIdentifiersList';
import {ASTCParametersList} from './ASTCParametersList';
import {ASTCDeclarator} from './ASTCDeclarator';
import {ASTCAssignmentExpression} from './ASTCAssignmentExpression';
import {ASTCTypeQualifiersList} from './ASTCTypeQualifiersList';
import {IsEmpty} from './interfaces/IsEmpty';

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
      'assignmentExpression',
      'typeQualifiersList',
    ],
  },
)
export class ASTCDirectDeclaratorArrayExpression extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    public readonly star?: boolean,
    public readonly typeQualifiersList?: ASTCTypeQualifiersList,
    public readonly assignmentExpression?: ASTCAssignmentExpression,
    kind: ASTCCompilerKind = ASTCCompilerKind.DirectAbstractDeclaratorArrayExpression,
  ) {
    super(kind, loc);
  }

  toString() {
    const {kind, star} = this;

    return ASTCCompilerNode.dumpAttributesToString(
      kind,
      {
        star,
      },
    );
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
export class ASTCDirectDeclaratorFnExpression extends ASTCCompilerNode implements IsEmpty {
  constructor(
    loc: NodeLocation,
    public readonly parameterTypeList?: ASTCParametersList,
    public readonly identifiersList?: ASTCIdentifiersList,
  ) {
    super(ASTCCompilerKind.DirectDeclaratorFnExpression, loc);
  }

  isEmpty() {
    const {parameterTypeList, identifiersList} = this;

    return !parameterTypeList && !identifiersList;
  }

  toString() {
    const {kind} = this;

    return ASTCCompilerNode.dumpAttributesToString(
      kind,
      {
        empty: this.isEmpty(),
      },
    );
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
      'directDeclarator',
      'arrayExpression',
      'fnExpression',
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
