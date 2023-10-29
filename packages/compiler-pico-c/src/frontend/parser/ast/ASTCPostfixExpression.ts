import * as R from 'ramda';

import { dumpAttributesToString } from '@ts-c-compiler/core';
import { walkOverFields } from '@ts-c-compiler/grammar';

import { Token } from '@ts-c-compiler/lexer';
import { NodeLocation } from '@ts-c-compiler/grammar';
import { ASTCCompilerNode, ASTCCompilerKind } from './ASTCCompilerNode';
import { ASTCPrimaryExpression } from './ASTCPrimaryExpression';
import { ASTCExpression } from './ASTCExpression';
import { ASTCArgumentsExpressionList } from './ASTCArgumentsExpressionList';
import { isFuncPtrDeclLikeType } from '../../analyze/types/function/CFunctionDeclType';

@walkOverFields({
  fields: ['expression'],
})
export class ASTCPostfixArrayExpression extends ASTCCompilerNode {
  constructor(loc: NodeLocation, readonly expression: ASTCExpression) {
    super(ASTCCompilerKind.PostfixArrayExpression, loc);
  }
}

@walkOverFields({
  fields: ['args'],
})
export class ASTCPostfixFnExpression extends ASTCCompilerNode {
  constructor(loc: NodeLocation, readonly args: ASTCArgumentsExpressionList) {
    super(ASTCCompilerKind.PostfixFnExpression, loc);
  }
}

export class ASTCPostfixDotExpression extends ASTCCompilerNode {
  constructor(loc: NodeLocation, readonly name: Token<string>) {
    super(ASTCCompilerKind.PostfixDotExpression, loc);
  }

  toString() {
    const { kind, name } = this;

    return dumpAttributesToString(kind, {
      name: name.text,
    });
  }
}

export class ASTCPostfixPtrExpression extends ASTCCompilerNode {
  constructor(loc: NodeLocation, readonly name: Token<string>) {
    super(ASTCCompilerKind.PostfixPtrExpression, loc);
  }

  toString() {
    const { kind, name } = this;

    return dumpAttributesToString(kind, {
      name: name.text,
    });
  }
}

@walkOverFields({
  fields: [
    'postfixExpression',
    'primaryExpression',
    'arrayExpression',
    'fnExpression',
    'dotExpression',
    'ptrExpression',
  ],
})
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
    const { kind, incExpression, decExpression } = this;

    return dumpAttributesToString(kind, {
      incExpression,
      decExpression,
    });
  }

  isPrimaryExpression() {
    return !!this.primaryExpression;
  }
  isArrayExpression() {
    return !!this.arrayExpression;
  }
  isFnExpression() {
    return !!this.fnExpression;
  }
  isDotExpression() {
    return !!this.dotExpression;
  }
  isPtrExpression() {
    return !!this.ptrExpression;
  }
  isIncExpression() {
    return this.incExpression;
  }
  isDecExpression() {
    return this.decExpression;
  }

  isFnPtrCallExpression() {
    return (
      isFuncPtrDeclLikeType(this.postfixExpression?.type) &&
      this.isPrimaryExpression()
    );
  }

  hasNestedPostfixExpression() {
    return this.postfixExpression;
  }

  getFnName(): string {
    return this.postfixExpression.primaryExpression?.identifier?.text;
  }

  getPreIncSign() {
    const { postfixExpression } = this;

    if (!postfixExpression) {
      return null;
    }

    if (postfixExpression.isDecExpression()) {
      return -1;
    }

    if (postfixExpression.isIncExpression()) {
      return 1;
    }

    return null;
  }

  getPostIncSign() {
    const { incExpression, decExpression } = this;

    if (incExpression) {
      return 1;
    }

    if (decExpression) {
      return -1;
    }

    return null;
  }

  getIncSign() {
    return this.getPreIncSign() ?? this.getPostIncSign();
  }

  isPreIncExpression() {
    return !R.isNil(this.getPreIncSign());
  }

  isPostIncExpression() {
    return !R.isNil(this.getPostIncSign());
  }
}
