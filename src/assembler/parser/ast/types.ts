export enum ASTNodeKind {
  INSTRUCTION,
  LABEL,
  DEFINE,
}

/**
 * User for resolve labels in AST
 */
export type BinaryLabelsOffsets = Map<string, number>;
