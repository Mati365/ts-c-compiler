import {TreeNode, ValueNode} from '@compiler/grammar/tree/TreeNode';
import {Grammar} from '@compiler/grammar/Grammar';
import {
  PreprocessorInterpretable,
  InterpreterResult,
  PreprocessorInterpreter,
} from './interpreter/PreprocessorInterpreter';

export enum PreprocessorIdentifier {
  DEFINE,
  MACRO,
  ENDMACRO,
  IF,
  ENDIF,
}

export enum ASTPreprocessorKind {
  Stmt = 'Stmt',
  DefineStmt = 'DefineStmt',
  IfStmt = 'IfStmt',
  MacroStmt = 'MacroStmt',
  SyntaxStmt = 'SyntaxStmt',

  // Expresisons
  LogicExpression = 'LogicExpression',

  // Math operators
  Value = 'Value',
  BinaryOperator = 'BinaryOperator',
}

/**
 * Checks if node kind is statement
 *
 * @export
 * @param {ASTPreprocessorNode} node
 * @returns {boolean}
 */
export function isStatementPreprocessorNode(node: ASTPreprocessorNode): boolean {
  switch (node.kind) {
    case ASTPreprocessorKind.Stmt:
    case ASTPreprocessorKind.DefineStmt:
    case ASTPreprocessorKind.IfStmt:
    case ASTPreprocessorKind.MacroStmt:
    case ASTPreprocessorKind.SyntaxStmt:
      return true;

    default:
      return false;
  }
}

export class PreprocessorGrammar extends Grammar<PreprocessorIdentifier, ASTPreprocessorKind> {}

export class ASTPreprocessorNode extends TreeNode<ASTPreprocessorKind> implements PreprocessorInterpretable {
  toEmitterLine(): string {
    return '\n';
  }

  /* eslint-disable @typescript-eslint/no-unused-vars */
  exec(interpreter: PreprocessorInterpreter): InterpreterResult {
    return null;
  }
  /* eslint-enable @typescript-eslint/no-unused-vars */
}

export class ASTPreprocessorValueNode<T>
  extends ValueNode<T, ASTPreprocessorKind>
  implements PreprocessorInterpretable {
  toEmitterLine(): string {
    return '\n';
  }

  /* eslint-disable @typescript-eslint/no-unused-vars */
  exec(interpreter: PreprocessorInterpreter): InterpreterResult {
    return null;
  }
  /* eslint-enable @typescript-eslint/no-unused-vars */
}
