import {dumpAttributesToString} from '@compiler/core/utils';
import {walkOverFields} from '@compiler/grammar/decorators/walkOverFields';

import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {Token} from '@compiler/lexer/tokens';
import {ASTCCompilerKind, ASTCCompilerNode} from './ASTCCompilerNode';

@walkOverFields(
  {
    fields: ['statement'],
  },
)
export class ASTCLabelStatement extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    readonly name: Token<string>,
    readonly statement: ASTCCompilerNode,
  ) {
    super(ASTCCompilerKind.LabelStmt, loc);
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
