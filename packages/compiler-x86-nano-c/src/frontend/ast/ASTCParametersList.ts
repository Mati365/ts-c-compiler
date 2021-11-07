import {walkOverFields} from '@compiler/grammar/decorators/walkOverFields';

import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {ASTCCompilerKind, ASTCCompilerNode} from './ASTCCompilerNode';
import {ASTCParameterDeclaration} from './ASTCParameterDeclaration';

@walkOverFields(
  {
    fields: [
      'items',
    ],
  },
)
export class ASTCParametersList extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    public readonly items: ASTCParameterDeclaration[],
  ) {
    super(ASTCCompilerKind.ParametersList, loc);
  }
}
