import * as R from 'ramda';

import {
  MIN_COMPILER_REG_LENGTH,
  MAX_COMPILER_REG_LENGTH,
} from '../../constants';

import {ParserError, ParserErrorCode} from '../../shared/ParserError';
import {InstructionArgSize, X86TargetCPU} from '../../types';
import {NumberToken} from '../lexer/tokens';

import {ASTNode} from '../ast/ASTNode';
import {ASTCompilerOption, CompilerOptions} from '../ast/def/ASTCompilerOption';
import {ASTLabelAddrResolver} from '../ast/instruction/ASTResolvableArg';
import {ASTTree} from '../ast/ASTParser';
import {ASTNodeKind} from '../ast/types';
import {ASTInstruction} from '../ast/instruction/ASTInstruction';
import {ASTDef} from '../ast/def/ASTDef';
import {ASTEqu} from '../ast/critical/ASTEqu';

import {ASTTimes} from '../ast/critical/ASTTimes';
import {
  ASTLabel,
  isLocalLabel,
  resolveLocalTokenAbsName,
} from '../ast/critical/ASTLabel';

import {BinaryInstruction} from './types/BinaryInstruction';
import {BinaryDefinition} from './types/BinaryDefinition';
import {BinaryRepeatedNode} from './types/BinaryRepeatedNode';
import {BinaryEqu} from './types/BinaryEqu';
import {BinaryBlob} from './BinaryBlob';

import {
  FirstPassResult,
  SecondPassResult,
  BinaryBlobsMap,
} from './BinaryPassResults';

export const MAGIC_LABELS = {
  CURRENT_LINE: '$',
  SECTION_START: '$$',
};

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
  private _mode: InstructionArgSize = InstructionArgSize.WORD;
  private _origin: number = 0x0;
  private _target: X86TargetCPU = X86TargetCPU.I_486;

  constructor(
    public readonly tree: ASTTree,
    public readonly maxPasses: number = 7,
  ) {}

  get origin() { return this._origin; }
  get mode() { return this._mode; }
  get target() { return this._target; }

  /**
   * Set origin which is absolute address
   * used to generated absolute offsets
   *
   * @param {number} origin
   * @memberof X86Compiler
   */
  setOrigin(origin: number): void {
    this._origin = origin;
  }

  /**
   * Change bits mode
   *
   * @param {number} mode
   * @memberof X86Compiler
   */
  setMode(mode: number): void {
    if (mode < MIN_COMPILER_REG_LENGTH || mode > MAX_COMPILER_REG_LENGTH)
      throw new ParserError(ParserErrorCode.UNSUPPORTED_COMPILER_MODE);

    this._mode = mode;
  }

  /**
   * First pass compiler, omit labels and split into multiple chunks
   *
   * @param {ASTTree} [tree=this.tree]
   * @param {boolean} [noAbstractInstructions=false]
   * @param {number} [initialOffset=0]
   * @returns {FirstPassResult}
   * @memberof X86Compiler
   */
  firstPass(
    tree: ASTTree = this.tree,
    noAbstractInstructions: boolean = false,
    initialOffset: number = 0,
  ): FirstPassResult {
    const result = new FirstPassResult(tree);

    const {target} = this;
    const {astNodes} = tree;
    const {labels, equ, nodesOffsets} = result;

    let offset = initialOffset;
    let originDefined = false;

    const isRedefinedKeyword = (keyword: string): boolean => (
      equ.has(keyword) || labels.has(keyword)
    );

    /**
     * Emits binary set of data for instruction
     *
     * @param {BinaryBlob} blob
     * @param {number} size
     */
    const emitBlob = (blob: BinaryBlob, size?: number): void => {
      const addr = this._origin + offset;
      const prevBlob = nodesOffsets.get(addr);

      // EQU has size = 0, it can overlap
      if (size === 0) {
        // some instructions has 0 bytes, chain them to existing to
        // preserve order of execution, maybe there will be better solution?
        if (prevBlob) {
          prevBlob.slaveBlobs = prevBlob.slaveBlobs || [];
          prevBlob.slaveBlobs.push(blob);
          return;
        }
      }

      nodesOffsets.set(addr, blob);
      if (prevBlob) {
        blob.slaveBlobs = blob.slaveBlobs || [];
        blob.slaveBlobs.push(prevBlob);
      }

      offset += size ?? blob.binary?.length ?? 1;
    };

    /**
     * Emits bytes for node from ASTnode,
     * performs initial compilation of instruction
     * with known size schemas
     *
     * @param {ASTNode} node
     */
    const processNode = (node: ASTNode): void => {
      const absoluteAddress = this._origin + offset;

      if (noAbstractInstructions && node.kind !== ASTNodeKind.INSTRUCTION && node.kind !== ASTNodeKind.DEFINE) {
        throw new ParserError(
          ParserErrorCode.UNPERMITTED_NODE_IN_POSTPROCESS_MODE,
          null,
          {
            node: node.toString(),
          },
        );
      }

      switch (node.kind) {
        case ASTNodeKind.COMPILER_OPTION: {
          const compilerOption = <ASTCompilerOption> node;
          const arg = <NumberToken> compilerOption.args[0];

          // origin set
          if (compilerOption.option === CompilerOptions.ORG) {
            if (originDefined)
              throw new ParserError(ParserErrorCode.ORIGIN_REDEFINED);

            this.setOrigin(arg.value.number);

            offset = 0;
            originDefined = true;

          // mode set
          } else if (compilerOption.option === CompilerOptions.BITS)
            this.setMode(arg.value.number / 8);
        } break;

        case ASTNodeKind.TIMES:
          emitBlob(
            new BinaryRepeatedNode(<ASTTimes> node),
            1,
          );
          break;

        case ASTNodeKind.INSTRUCTION: {
          const astInstruction = <ASTInstruction> node;
          const resolved = astInstruction.tryResolveSchema(null, null, target);

          if (!resolved) {
            throw new ParserError(
              ParserErrorCode.UNKNOWN_COMPILER_INSTRUCTION,
              null,
              {
                instruction: astInstruction.toString(),
              },
            );
          }

          emitBlob(
            new BinaryInstruction(astInstruction).compile(this, absoluteAddress),
          );
        } break;

        case ASTNodeKind.DEFINE:
          emitBlob(
            new BinaryDefinition(<ASTDef> node).compile(),
          );
          break;

        case ASTNodeKind.EQU: {
          const equNode = (<ASTEqu> node);
          const blob = new BinaryEqu(equNode);

          if (isRedefinedKeyword(equNode.name)) {
            throw new ParserError(
              ParserErrorCode.EQU_ALREADY_DEFINED,
              null,
              {
                name: equNode.name,
              },
            );
          }

          equ.set(equNode.name, blob);
          emitBlob(blob, 0);
        } break;

        case ASTNodeKind.LABEL: {
          const labelName = (<ASTLabel> node).name;

          if (isRedefinedKeyword(labelName)) {
            throw new ParserError(
              ParserErrorCode.LABEL_ALREADY_DEFINED,
              null,
              {
                label: labelName,
              },
            );
          }

          labels.set(labelName, absoluteAddress);
        } break;

        default:
          throw new ParserError(
            ParserErrorCode.UNKNOWN_COMPILER_INSTRUCTION,
            null,
            {
              instruction: node.toString(),
            },
          );
      }
    };

    R.forEach(processNode, astNodes);
    return result;
  }

  /**
   * Find unresolved instructions, try resolve them and emit binaries
   *
   * @private
   * @param {FirstPassResult} firstPassResult
   * @returns {SecondPassResult}
   * @memberof X86Compiler
   */
  private secondPass(firstPassResult: FirstPassResult): SecondPassResult {
    const {target} = this;
    const {tree} = firstPassResult;
    const {labels, nodesOffsets, equ} = firstPassResult;

    const result = new SecondPassResult(0x0, labels);
    let success = false;
    let needSort = false;
    let sectionStartOffset = null;

    /**
     * Lookups into tree and resolves nested label args
     *
     * @see
     *  instructionIndex must be equal count of instructions in first phase!
     *
     * @param {ASTNode} astNode
     * @param {number} instructionOffset
     * @returns {ASTLabelAddrResolver}
     */
    function labelResolver(astNode: ASTNode, instructionOffset: number): ASTLabelAddrResolver {
      return (name: string): number => {
        if (sectionStartOffset !== null && name === MAGIC_LABELS.SECTION_START)
          return sectionStartOffset;

        if (name === MAGIC_LABELS.CURRENT_LINE)
          return instructionOffset;

        if (equ.has(name))
          return equ.get(name).val ?? 0;

        if (isLocalLabel(name)) {
          name = resolveLocalTokenAbsName(
            tree,
            name,
            R.indexOf(astNode, tree.astNodes),
          );
        }

        return labels.get(name);
      };
    }

    /**
     * Resizes all block after offset which is enlarged
     *
     * @param {number} offset
     * @param {number} enlarge
     */
    function resizeBlockAtOffset(offset: number, enlarge: number): void {
      // if so decrement precceding instruction offsets and label offsets
      for (const [label, labelOffset] of labels) {
        if (labelOffset > offset)
          labels.set(label, labelOffset + enlarge);
      }

      // if so decrement precceding instruction offsets and label offsets
      const offsetsArray = Array.from(nodesOffsets);
      for (const [instructionOffset] of offsetsArray) {
        if (instructionOffset > offset)
          nodesOffsets.delete(instructionOffset);
      }

      for (const [instructionOffset, nextInstruction] of offsetsArray) {
        if (instructionOffset > offset)
          nodesOffsets.set(instructionOffset + enlarge, nextInstruction);
      }
    }

    /**
     * Appends blobs map at current offset to nodesOffsets
     *
     * @param {number} offset
     * @param {BinaryBlobsMap} blobs
     */
    function appendBlobsAtOffset(offset: number, blobs: BinaryBlobsMap): void {
      needSort = true;
      for (const [blobOffset, blob] of blobs)
        nodesOffsets.set(offset + blobOffset, blob);
    }

    /**
     * Process EQU, returns true if value changed
     *
     * @param {number} offset
     * @param {BinaryEqu} blob
     * @returns {boolean}
     */
    function passEqu(offset: number, blob: BinaryEqu): boolean {
      const {
        ast,
        labeled,
        val: prevValue,
      } = blob;

      // ignore, it is propably already resolved
      if (!labeled)
        return false;

      blob.pass(
        labelResolver(ast, offset),
      );

      return prevValue !== blob.val || R.isNil(prevValue);
    }

    // proper resolve labels
    for (let pass = 0; pass < this.maxPasses; ++pass) {
      let needPass = false;
      sectionStartOffset = null;

      // eslint-disable-next-line prefer-const
      for (let [offset, blob] of nodesOffsets) {
        if (sectionStartOffset === null)
          sectionStartOffset = offset;

        // check for slave blobs (0 bytes instructions, EQU)
        if (blob.slaveBlobs) {
          // todo: handle as array?
          const topSlave = blob.slaveBlobs[0];

          if (topSlave instanceof BinaryEqu) {
            if (passEqu(offset, topSlave))
              needPass = true;
          } else
            throw new ParserError(ParserErrorCode.INCORRECT_SLAVE_BLOBS);
        }

        if (blob instanceof BinaryEqu) {
          // ignore, it is propably already resolved
          if (passEqu(offset, blob))
            needPass = true;
          else
            continue;
        } else if (blob instanceof BinaryRepeatedNode) {
          // repeats instruction nth times
          const blobResult = blob.pass(this, offset - this._origin, labelResolver(blob.ast, offset));
          const blobSize = blobResult.getByteSize();

          // prevent loop, kill times
          nodesOffsets.delete(offset);

          resizeBlockAtOffset(offset, Math.max(1, blobSize - 1));
          appendBlobsAtOffset(0, blobResult.nodesOffsets);

          needPass = true;
          break;
        } else if (blob instanceof BinaryInstruction) {
          const {ast, binary} = blob;
          const pessimisticSize = binary.length;

          // generally check for JMP/CALL etc instructions
          if (ast.isConstantSize())
            continue;

          // matcher must choose which instruction to match
          // based on origin it must choose between short relative
          // jump and long
          ast.tryResolveSchema(
            labelResolver(ast, offset),
            offset,
            target,
          );

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
            ast.unresolvedArgs = true;

            nodesOffsets.set(offset, recompiled);
            resizeBlockAtOffset(offset, -shrinkBytes);
          }

          // select first schema, it will be discarded if next instruction have label
          ast.schemas = [
            ast.schemas[0],
          ];
        }
      }

      if (!needPass) {
        success = true;
        break;
      } else
        result.totalPasses = pass + 1;
    }

    // exhaust tries count
    if (!success)
      throw new ParserError(ParserErrorCode.UNABLE_TO_COMPILE_FILE);

    // produce binaries
    const orderedOffsets = (
      needSort
        ? (
          Array
            .from(nodesOffsets)
            .sort((a, b) => a[0] - b[0])
        )
        : nodesOffsets
    );

    for (const [offset, blob] of orderedOffsets) {
      let compiled = blob;
      if (blob instanceof BinaryInstruction && !blob.ast.isConstantSize())
        compiled = blob.compile(this, offset);

      result.byteSize = Math.max(result.byteSize, offset + blob.binary.length - this._origin);
      result.blobs.set(offset, compiled);
    }

    return result;
  }

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
