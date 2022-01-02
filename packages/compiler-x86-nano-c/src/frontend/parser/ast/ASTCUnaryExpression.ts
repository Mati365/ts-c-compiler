import {dumpAttributesToString} from '@compiler/core/utils';
import {walkOverFields} from '@compiler/grammar/decorators/walkOverFields';

import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {CUnaryCastOperator} from '@compiler/x86-nano-c/constants';
import {ASTCCompilerKind, ASTCCompilerNode} from './ASTCCompilerNode';
import {ASTCTypeName} from './ASTCTypeName';
import {ASTCCastExpression} from './ASTCCastExpression';
import {ASTCPostfixExpression} from './ASTCPostfixExpression';

@walkOverFields(
  {
    fields: ['unaryExpression'],
  },
)
export class ASTCIncUnaryExpression extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    readonly unaryExpression: ASTCUnaryExpression,
  ) {
    super(ASTCCompilerKind.IncUnaryExpression, loc);
  }
}

@walkOverFields(
  {
    fields: ['unaryExpression'],
  },
)
export class ASTCDecUnaryExpression extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    readonly unaryExpression: ASTCUnaryExpression,
  ) {
    super(ASTCCompilerKind.DecUnaryExpression, loc);
  }
}

@walkOverFields(
  {
    fields: [
      'typeName',
      'unaryExpression',
    ],
  },
)
export class ASTCSizeofUnaryExpression extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    readonly typeName?: ASTCTypeName,
    readonly unaryExpression?: ASTCUnaryExpression,
  ) {
    super(ASTCCompilerKind.SizeofUnaryExpression, loc);
  }
}

@walkOverFields(
  {
    fields: ['castExpression'],
  },
)
export class ASTCCastUnaryExpression extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    readonly operator: CUnaryCastOperator,
    readonly castExpression: ASTCCastExpression,
  ) {
    super(ASTCCompilerKind.CastUnaryExpression, loc);
  }

  toString() {
    const {kind, operator} = this;

    return dumpAttributesToString(
      kind,
      {
        operator,
      },
    );
  }
}

@walkOverFields(
  {
    fields: [
      'postfixExpression',
      'castExpression',
      'decExpression',
      'incExpression',
      'sizeofExpression',
    ],
  },
)
export class ASTCUnaryExpression extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    readonly postfixExpression?: ASTCPostfixExpression,
    readonly castExpression?: ASTCCastUnaryExpression,
    readonly decExpression?: ASTCDecUnaryExpression,
    readonly incExpression?: ASTCIncUnaryExpression,
    readonly sizeofExpression?: ASTCSizeofUnaryExpression,
  ) {
    super(ASTCCompilerKind.UnaryExpression, loc);
  }
}
