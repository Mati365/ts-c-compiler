import {ASTCCompilerKind, ASTCInitializer} from '@compiler/x86-nano-c/frontend/parser/ast';
import {ASTCTypeCreator} from './ASTCTypeCreator';

/**
 * Assigns type to ASTCInitializerTypeCreator
 *
 * @export
 * @class ASTCInitializerTypeCreator
 * @extends {ASTCTypeCreator<ASTCUnaryExpression>}
 */
export class ASTCInitializerTypeCreator extends ASTCTypeCreator<ASTCInitializer> {
  kind = ASTCCompilerKind.Initializer;

  override leave(node: ASTCInitializer): void {
    node.type = node.assignmentExpression?.type;
  }
}
