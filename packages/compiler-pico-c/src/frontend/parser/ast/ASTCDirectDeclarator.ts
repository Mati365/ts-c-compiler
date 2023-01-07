import { walkOverFields } from '@compiler/grammar/decorators/walkOverFields';
import { dumpAttributesToString } from '@compiler/core/utils';

import { IsEmpty } from '@compiler/core/interfaces/IsEmpty';
import { Token } from '@compiler/lexer/tokens';
import { NodeLocation } from '@compiler/grammar/tree/NodeLocation';

import { ASTCCompilerKind, ASTCCompilerNode } from './ASTCCompilerNode';
import { ASTCIdentifiersList } from './ASTCIdentifiersList';
import { ASTCParametersList } from './ASTCParametersList';
import { ASTCAssignmentExpression } from './ASTCAssignmentExpression';
import { ASTCTypeQualifiersList } from './ASTCTypeQualifiersList';

/**
 * Handlers []
 */
@walkOverFields({
  fields: ['assignmentExpression', 'typeQualifiersList'],
})
export class ASTCDirectDeclaratorArrayExpression extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    readonly star?: boolean,
    readonly typeQualifiersList?: ASTCTypeQualifiersList,
    readonly assignmentExpression?: ASTCAssignmentExpression,
    kind: ASTCCompilerKind = ASTCCompilerKind.DirectAbstractDeclaratorArrayExpression,
  ) {
    super(kind, loc);
  }

  toString() {
    const { kind, star } = this;

    return dumpAttributesToString(kind, {
      star,
    });
  }
}

/**
 * Handlers ()
 */
@walkOverFields({
  fields: ['parameterTypeList', 'identifiersList'],
})
export class ASTCDirectDeclaratorFnExpression
  extends ASTCCompilerNode
  implements IsEmpty
{
  constructor(
    loc: NodeLocation,
    readonly parameterTypeList?: ASTCParametersList,
    readonly identifiersList?: ASTCIdentifiersList,
  ) {
    super(ASTCCompilerKind.DirectDeclaratorFnExpression, loc);
  }

  get argsNodes() {
    return this.parameterTypeList?.children || [];
  }

  get identifiersNodes() {
    return this.identifiersList?.children || [];
  }

  isEmpty() {
    const { parameterTypeList, identifiersList } = this;

    return !parameterTypeList && !identifiersList;
  }

  toString() {
    const { kind } = this;

    return dumpAttributesToString(kind, {
      empty: this.isEmpty(),
    });
  }
}

@walkOverFields({
  fields: ['directDeclarator', 'declarator', 'arrayExpression', 'fnExpression'],
})
export class ASTCDirectDeclarator extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    readonly identifier?: Token<string>,
    readonly declarator?: ASTCCompilerNode,
    readonly arrayExpression?: ASTCDirectDeclaratorArrayExpression,
    readonly fnExpression?: ASTCDirectDeclaratorFnExpression,
    readonly directDeclarator?: ASTCDirectDeclarator,
  ) {
    super(ASTCCompilerKind.DirectDeclarator, loc);
  }

  isArrayExpression() {
    return !!this.arrayExpression;
  }

  isFnExpression() {
    return !!this.fnExpression;
  }

  isIdentifier() {
    return !!this.identifier;
  }

  toString() {
    const { kind, identifier } = this;

    return dumpAttributesToString(kind, {
      identifier: identifier?.text,
    });
  }
}
