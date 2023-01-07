import {ASTCCompilerKind, ASTCInitializer} from '@compiler/pico-c/frontend/parser/ast';
import {ASTCTypeCreator} from './ASTCTypeCreator';

export class ASTCInitializerTypeCreator extends ASTCTypeCreator<ASTCInitializer> {
  kind = ASTCCompilerKind.Initializer;

  override leave(node: ASTCInitializer): void {
    node.type = node.assignmentExpression?.type;
  }
}
