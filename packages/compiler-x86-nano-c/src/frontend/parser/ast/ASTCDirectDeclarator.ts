import {walkOverFields} from '@compiler/grammar/decorators/walkOverFields';
import {dumpAttributesToString} from '@compiler/core/utils';

import {IsEmpty} from '@compiler/core/interfaces/IsEmpty';
import {Token} from '@compiler/lexer/tokens';
import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';

import {ASTCCompilerKind, ASTCCompilerNode} from './ASTCCompilerNode';
import {ASTCIdentifiersList} from './ASTCIdentifiersList';
import {ASTCParametersList} from './ASTCParametersList';
import {ASTCAssignmentExpression} from './ASTCAssignmentExpression';
import {ASTCTypeQualifiersList} from './ASTCTypeQualifiersList';

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

    return dumpAttributesToString(
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

  get argsNodes() { return this.parameterTypeList?.children || []; }
  get identifiersNodes() { return this.identifiersList?.children || []; }

  isEmpty() {
    const {parameterTypeList, identifiersList} = this;

    return !parameterTypeList && !identifiersList;
  }

  toString() {
    const {kind} = this;

    return dumpAttributesToString(
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
    public readonly declarator?: ASTCCompilerNode,
    public readonly arrayExpression?: ASTCDirectDeclaratorArrayExpression,
    public readonly fnExpression?: ASTCDirectDeclaratorFnExpression,
    public readonly directDeclarator?: ASTCDirectDeclarator,
  ) {
    super(ASTCCompilerKind.DirectDeclarator, loc);
  }

  isArrayExpression() { return !!this.arrayExpression; }
  isFnExpression() { return !!this.fnExpression; }
  isIdentifier() { return !!this.identifier; }

  toString() {
    const {kind, identifier} = this;

    return dumpAttributesToString(
      kind,
      {
        identifier: identifier?.text,
      },
    );
  }
}
