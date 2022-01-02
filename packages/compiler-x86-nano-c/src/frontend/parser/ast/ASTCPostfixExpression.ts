import {dumpAttributesToString} from '@compiler/core/utils';
import {walkOverFields} from '@compiler/grammar/decorators/walkOverFields';

import {Token} from '@compiler/lexer/tokens';
import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {ASTCCompilerNode, ASTCCompilerKind} from './ASTCCompilerNode';
import {ASTCPrimaryExpression} from './ASTCPrimaryExpression';
import {ASTCExpression} from './ASTCExpression';
import {ASTCArgumentsExpressionList} from './ASTCArgumentsExpressionList';

@walkOverFields(
  {
    fields: ['expression'],
  },
)
export class ASTCPostfixArrayExpression extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    readonly expression: ASTCExpression,
  ) {
    super(ASTCCompilerKind.PostfixArrayExpression, loc);
  }
}

@walkOverFields(
  {
    fields: ['args'],
  },
)
export class ASTCPostfixFnExpression extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    readonly args: ASTCArgumentsExpressionList,
  ) {
    super(ASTCCompilerKind.PostfixFnExpression, loc);
  }
}

export class ASTCPostfixDotExpression extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    readonly name: Token<string>,
  ) {
    super(ASTCCompilerKind.PostfixDotExpression, loc);
  }

  toString() {
    const {kind, name} = this;

    return dumpAttributesToString(
      kind,
      {
        name: name.text,
      },
    );
  }
}

export class ASTCPostfixPtrExpression extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    readonly name: Token<string>,
  ) {
    super(ASTCCompilerKind.PostfixPtrExpression, loc);
  }

  toString() {
    const {kind, name} = this;

    return dumpAttributesToString(
      kind,
      {
        name: name.text,
      },
    );
  }
}

@walkOverFields(
  {
    fields: [
      'postfixExpression',
      'primaryExpression',
      'arrayExpression',
      'fnExpression',
      'dotExpression',
      'ptrExpression',
    ],
  },
)
export class ASTCPostfixExpression extends ASTCCompilerNode {
  readonly primaryExpression: ASTCPrimaryExpression;
  readonly arrayExpression: ASTCPostfixArrayExpression;
  readonly fnExpression: ASTCPostfixFnExpression;
  readonly dotExpression: ASTCPostfixDotExpression;
  readonly ptrExpression: ASTCPostfixPtrExpression;
  readonly incExpression: boolean;
  readonly decExpression: boolean;
  readonly postfixExpression: ASTCPostfixExpression;

  constructor(loc: NodeLocation, attrs: Partial<ASTCPostfixExpression>) {
    super(ASTCCompilerKind.PostfixExpression, loc);
    Object.assign(this, attrs);
  }

  toString() {
    const {kind, incExpression, decExpression} = this;

    return dumpAttributesToString(
      kind,
      {
        incExpression,
        decExpression,
      },
    );
  }

  isPrimaryExpression() { return !!this.primaryExpression; }
  isArrayExpression() { return !!this.arrayExpression; }
  isFnExpression() { return !!this.fnExpression; }
  isDotExpression() { return !!this.dotExpression; }
  isPtrExpression() { return !!this.ptrExpression; }
  isIncExpression() { return this.incExpression; }
  isDecExpression() { return this.decExpression; }
  hasNestedPostfixExpression() { return this.postfixExpression; }
}
