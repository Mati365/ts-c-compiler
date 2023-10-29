import { ASTCCompilerKind, ASTCInitializer } from 'frontend/parser/ast';
import { ASTCTypeCreator } from './ASTCTypeCreator';

export class ASTCInitializerTypeCreator extends ASTCTypeCreator<ASTCInitializer> {
  kind = ASTCCompilerKind.Initializer;

  override leave(node: ASTCInitializer): void {
    node.type = node.assignmentExpression?.type;
  }
}
