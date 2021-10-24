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
export class ASTCParametersTypedList extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    public readonly items: ASTCParameterDeclaration[],
  ) {
    super(ASTCCompilerKind.ParametersTypedList, loc);
  }
}
