import * as R from 'ramda';

import {ParserError, ParserErrorCode} from '../../shared/ParserError';
import {InstructionArgSize} from '../../types';

import {ASTLabelAddrResolver} from '../ast/instruction/ASTResolvableArg';
import {ASTTree} from '../ast/ASTParser';
import {ASTNodeKind} from '../ast/types';
import {ASTInstruction} from '../ast/instruction/ASTInstruction';
import {ASTDef} from '../ast/def/ASTDef';
import {
  ASTLabel,
  isLocalLabel,
  resolveLocalTokenAbsName,
} from '../ast/label/ASTLabel';

import {BinaryInstruction} from './BinaryInstruction';
import {BinaryBlob} from './BinaryBlob';
import {BinaryDefinition} from './BinaryDefinition';

import {
  FirstPassResult,
  SecondPassResult,
} from './BinaryPassResults';

/**
 * Transforms AST tree into binary set of data
 *
 * @see
 *  Output may contain unresolved ASTInstruction (like jmps) for second pass!
 *  They should be erased after second pass
 *
 * @export
 * @class X86Compiler
 */
export class X86Compiler {
  constructor(
    public readonly tree: ASTTree,
    public readonly mode: InstructionArgSize = InstructionArgSize.WORD,
    public readonly maxPasses: number = 4,
  ) {}

  /**
   * First pass compiler, omit labels and split into multiple chunks
   *
   * @private
   * @returns {FirstPassResult}
   * @memberof X86Compiler
   */
  private firstPass(): FirstPassResult {
    const result = new FirstPassResult;

    const {astNodes} = this.tree;
    const {labels} = result;

    let offset = 0;

    const emitBlob = (blob: BinaryBlob): void => {
      result.nodesOffsets.set(offset, blob);
      offset += blob.binary.length;
    };

    R.forEach(
      (node) => {
        switch (node.kind) {
          case ASTNodeKind.INSTRUCTION:
            emitBlob(new BinaryInstruction(<ASTInstruction> node).compile(this, offset));
            break;

          case ASTNodeKind.DEFINE:
            emitBlob(new BinaryDefinition(<ASTDef> node).compile());
            break;

          case ASTNodeKind.LABEL: {
            const labelName = (<ASTLabel> node).name;

            if (labels.has(labelName))
              throw new ParserError(ParserErrorCode.LABEL_ALREADY_DEFINED, null, {label: labelName});

            labels.set(labelName, offset);
          } break;

          default:
            throw new ParserError(ParserErrorCode.UNKNOWN_COMPILER_INSTRUCTION, null, {instruction: node.toString()});
        }
      },
      astNodes,
    );

    return result;
  }

  /* eslint-disable class-methods-use-this */
  /**
   * Find unresolved instructions, try resolve them and emit binaries
   *
   * @private
   * @param {FirstPassResult} firstPassResult
   * @returns {SecondPassResult}
   * @memberof X86Compiler
   */
  private secondPass(firstPassResult: FirstPassResult): SecondPassResult {
    const {tree} = this;
    const {labels, nodesOffsets} = firstPassResult;

    const result = new SecondPassResult(0x0, labels);
    let success = false;

    /**
     * Lookups into tree and resolves nested label args
     *
     * @see
     *  instructionIndex must be equal count of instructions in first phase!
     *
     * @param {ASTInstruction} astInstruction
     * @returns {ASTLabelAddrResolver}
     */
    function labelResolver(astInstruction: ASTInstruction): ASTLabelAddrResolver {
      return (name: string): number => {
        if (isLocalLabel(name)) {
          name = resolveLocalTokenAbsName(
            tree,
            name,
            R.indexOf(astInstruction, tree.astNodes),
          );
        }

        return labels.get(name);
      };
    }

    // proper resolve labels
    for (let pass = 0; pass < this.maxPasses; ++pass) {
      let needPass = false;

      // eslint-disable-next-line prefer-const
      for (let [offset, blob] of nodesOffsets) {
        if (blob instanceof BinaryInstruction) {
          const {ast, binary} = blob;
          const pessimisticSize = binary.length;

          // generally check for JMP/CALL etc instructions
          if (ast.labeledInstruction)
            ast.tryResolveSchema(labelResolver(ast));

          // single instruction might contain multiple schemas but never 0
          const {schemas} = ast;
          if (!schemas.length) {
            throw new ParserError(
              ParserErrorCode.UNKNOWN_COMPILER_INSTRUCTION,
              null,
              {
                instruction: ast.toString(),
              },
            );
          }

          // check if instruction after replacing labels has been shrinked
          // if so - force rewrite precceding instrutions and labels
          const recompiled = new BinaryInstruction(ast).compile(this, offset);
          const shrinkBytes = pessimisticSize - recompiled.binary.length;
          if (shrinkBytes) {
            needPass = true;
            nodesOffsets.set(offset, recompiled);

            // if so decrement precceding instruction offsets and label offsets
            for (const [label, labelOffset] of labels) {
              if (labelOffset > offset)
                labels.set(label, labelOffset - shrinkBytes);
            }

            // if so decrement precceding instruction offsets and label offsets
            for (const [instructionOffset, nextInstruction] of Array.from(nodesOffsets)) {
              if (instructionOffset > offset) {
                nodesOffsets.delete(instructionOffset);
                nodesOffsets.set(instructionOffset - shrinkBytes, nextInstruction);
              }
            }
          }

          // select first schema, it will be discarded if next instruction have label
          ast.schemas = [
            ast.schemas[0],
          ];
        }
      }

      if (!needPass) {
        result.totalPasses = pass + 1;
        success = true;
        break;
      }
    }

    // exhaust tries count
    if (!success)
      throw new ParserError(ParserErrorCode.UNABLE_TO_COMPILE_FILE);

    // produce binaries
    for (const [offset, blob] of nodesOffsets) {
      result.blobs.set(
        offset,
        blob.compile(this, offset),
      );
    }

    return result;
  }
  /* eslint-enable class-methods-use-this */

  /**
   * Transform provided AST nodes array into binary blobs
   *
   * @returns {X86Compiler}
   * @memberof X86Compiler
   */
  compile(): SecondPassResult {
    if (!this.tree)
      return null;

    return this.secondPass(
      this.firstPass(),
    );
  }
}

/**
 * Transform array of nodes into binary
 *
 * @export
 * @param {ASTTree} tree
 */
export function compile(tree: ASTTree): void {
  const t = Date.now();
  const output = new X86Compiler(tree).compile();

  /* eslint-disable no-console */
  const str = output?.toString();
  if (str)
    console.log(`Took: ${Date.now() - t}ms\n${str}`);
  /* eslint-enable no-console */
}
