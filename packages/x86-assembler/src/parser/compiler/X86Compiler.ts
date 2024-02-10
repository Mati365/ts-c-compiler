import * as R from 'ramda';
import * as E from 'fp-ts/Either';

import { CompilerError } from '@ts-c-compiler/core';
import { NumberToken, Token } from '@ts-c-compiler/lexer';

import { MIN_COMPILER_REG_LENGTH, MAX_COMPILER_REG_LENGTH } from '../../constants';

import { isReservedKeyword } from '../utils/isReservedKeyword';
import { isExternalLinkerSymbol } from '../utils/externalLinkerLabel';
import { rpnTokens } from './utils/rpnTokens';

import { ParserError, ParserErrorCode } from '../../shared/ParserError';
import { InstructionArgSize, X86TargetCPU } from '../../types';

import { ASTAsmNode } from '../ast/ASTAsmNode';
import { ASTCompilerOption, CompilerOptions } from '../ast/def/ASTCompilerOption';

import { ASTLabelAddrResolver } from '../ast/instruction/ASTResolvableArg';
import { ASTAsmTree } from '../ast/ASTAsmParser';
import { ASTNodeKind } from '../ast/types';
import { ASTInstruction } from '../ast/instruction/ASTInstruction';
import { ASTDef } from '../ast/def/ASTDef';
import { ASTEqu } from '../ast/critical/ASTEqu';

import { ASTTimes } from '../ast/critical/ASTTimes';
import {
  ASTLabel,
  isLocalLabel,
  resolveLocalTokenAbsName,
} from '../ast/critical/ASTLabel';

import { BinaryInstruction } from './types/BinaryInstruction';
import { BinaryDefinition } from './types/BinaryDefinition';
import { BinaryRepeatedNode } from './types/BinaryRepeatedNode';
import { BinaryEqu } from './types/BinaryEqu';
import { BinaryBlob } from './BinaryBlob';

import { FirstPassResult, SecondPassResult, BinaryBlobsMap } from './BinaryPassResults';

export const MAGIC_LABELS = {
  CURRENT_LINE: '$',
  SECTION_START: '$$',
};

export type X86ExternalLinkerLabelAddrGenerator = (attr: {
  name: string;
  instructionOffset: number;
}) => number;

export type X86AsmCompilerConfig = {
  maxPasses: number;
  externalLinkerAddrGenerator?: X86ExternalLinkerLabelAddrGenerator;
};

/**
 * Transforms AST tree into binary set of data
 *
 * @see
 *  Output may contain unresolved ASTInstruction (like jmps) for second pass!
 *  They should be erased after second pass
 */
export class X86Compiler {
  private _mode: InstructionArgSize = InstructionArgSize.WORD;
  private _origin: number = 0x0;
  private _target: X86TargetCPU = X86TargetCPU.I_486;

  constructor(
    readonly tree: ASTAsmTree,
    readonly config: X86AsmCompilerConfig = { maxPasses: 7 },
  ) {}

  get origin() {
    return this._origin;
  }

  get mode() {
    return this._mode;
  }

  get target() {
    return this._target;
  }

  /**
   * Set origin which is absolute address
   * used to generated absolute offsets
   */
  setOrigin(origin: number): void {
    this._origin = origin;
  }

  /**
   * Change bits mode
   */
  setMode(mode: number): void {
    if (mode < MIN_COMPILER_REG_LENGTH || mode > MAX_COMPILER_REG_LENGTH) {
      throw new ParserError(ParserErrorCode.UNSUPPORTED_COMPILER_MODE);
    }

    this._mode = mode;
  }

  /**
   * Set cpu target
   */
  setTarget(target: X86TargetCPU): void {
    if (R.isNil(target)) {
      throw new ParserError(ParserErrorCode.UNSUPPORTED_COMPILER_TARGET);
    }

    this._target = target;
  }

  /**
   * First pass compiler, omit labels and split into multiple chunks
   */
  firstPass(
    tree: ASTAsmTree = this.tree,
    noAbstractInstructions: boolean = false,
    initialOffset: number = 0,
  ): FirstPassResult {
    const result = new FirstPassResult(tree);

    const { target } = this;
    const { astNodes } = tree;
    const { labels, equ, nodesOffsets } = result;

    let offset = initialOffset;
    let originDefined = false;

    /**
     * Simplified version of keywordResolver but returns only
     * first phase labels values or
     */
    function criticalKeywordResolver(name: string): number {
      if (equ.has(name)) {
        return equ.get(name).getValue() ?? 0;
      }

      return undefined;
    }

    /**
     * Resolves token value
     */
    function criticalMathTokensEvaluate(tokens: Token[]): number {
      return rpnTokens(tokens, {
        keywordResolver: criticalKeywordResolver,
      });
    }

    const isRedefinedKeyword = (keyword: string): boolean =>
      equ.has(keyword) || labels.has(keyword);

    /**
     * Emits binary set of data for instruction
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

        // prevent nesting slaves
        if (prevBlob.slaveBlobs) {
          blob.slaveBlobs.push(...prevBlob.slaveBlobs);
          prevBlob.slaveBlobs = null;
        }

        blob.slaveBlobs.push(prevBlob);
      }

      offset += size ?? blob.getBinary()?.length ?? 1;
    };

    /**
     * Emits bytes for node from ASTnode,
     * performs initial compilation of instruction
     * with known size schemas
     */
    const processNode = (node: ASTAsmNode): void => {
      const absoluteAddress = this._origin + offset;

      if (
        noAbstractInstructions &&
        node.kind !== ASTNodeKind.INSTRUCTION &&
        node.kind !== ASTNodeKind.DEFINE
      ) {
        throw new ParserError(
          ParserErrorCode.UNPERMITTED_NODE_IN_POSTPROCESS_MODE,
          node.loc.start,
          {
            node: node.toString(),
          },
        );
      }

      switch (node.kind) {
        /** [org 0x1] */
        case ASTNodeKind.COMPILER_OPTION:
          {
            const compilerOption = <ASTCompilerOption>node;

            // origin set
            if (compilerOption.option === CompilerOptions.ORG) {
              if (originDefined) {
                throw new ParserError(ParserErrorCode.ORIGIN_REDEFINED, node.loc.start);
              }

              this.setOrigin(criticalMathTokensEvaluate(compilerOption.args));

              offset = 0;
              originDefined = true;

              // mode set
            } else if (compilerOption.option === CompilerOptions.BITS) {
              this.setMode(criticalMathTokensEvaluate(compilerOption.args) / 8);

              // target set
            } else if (compilerOption.option === CompilerOptions.TARGET) {
              const arg = <NumberToken>compilerOption.args[0];

              this.setTarget(X86TargetCPU[`I_${arg.upperText}`]);
            }
          }
          break;

        /** times 10 db nop */
        case ASTNodeKind.TIMES:
          emitBlob(new BinaryRepeatedNode(<ASTTimes>node), 1);
          break;

        /** xor ax, ax */
        case ASTNodeKind.INSTRUCTION:
          {
            const astInstruction = <ASTInstruction>node;
            const resolved = astInstruction.tryResolveSchema(null, null, target);

            if (!resolved) {
              throw new ParserError(
                ParserErrorCode.UNKNOWN_COMPILER_INSTRUCTION,
                node.loc.start,
                {
                  instruction: astInstruction.toString(),
                },
              );
            }

            emitBlob(
              new BinaryInstruction(astInstruction).compile(this, absoluteAddress),
            );
          }
          break;

        /** db 0x0 */
        case ASTNodeKind.DEFINE:
          emitBlob(new BinaryDefinition(<ASTDef>node).compile());
          break;

        /** test equ 0x0 */
        case ASTNodeKind.EQU:
          {
            const equNode = <ASTEqu>node;
            const blob = new BinaryEqu(equNode);

            if (isReservedKeyword(equNode.name)) {
              throw new ParserError(ParserErrorCode.USED_RESERVED_NAME, node.loc.start, {
                name: equNode.name,
              });
            }

            if (isRedefinedKeyword(equNode.name)) {
              throw new ParserError(ParserErrorCode.EQU_ALREADY_DEFINED, node.loc.start, {
                name: equNode.name,
              });
            }

            equ.set(equNode.name, blob);
            emitBlob(blob, 0);
          }
          break;

        /** test: */
        case ASTNodeKind.LABEL:
          {
            const labelName = (<ASTLabel>node).name;

            if (isReservedKeyword(labelName)) {
              throw new ParserError(ParserErrorCode.USED_RESERVED_NAME, node.loc.start, {
                name: labelName,
              });
            }

            if (isRedefinedKeyword(labelName)) {
              throw new ParserError(
                ParserErrorCode.LABEL_ALREADY_DEFINED,
                node.loc.start,
                {
                  label: labelName,
                },
              );
            }

            labels.set(labelName, absoluteAddress);
          }
          break;

        default:
          throw new ParserError(
            ParserErrorCode.UNKNOWN_COMPILER_INSTRUCTION,
            node.loc.start,
            {
              instruction: node.toString(),
            },
          );
      }
    };

    R.forEach((node: ASTAsmNode) => {
      try {
        processNode(node);
      } catch (e) {
        e.loc = e.loc ?? node.loc.start;

        throw e;
      }
    }, astNodes);
    return result;
  }

  /**
   * Find unresolved instructions, try resolve them and emit binaries
   */
  private secondPass(firstPassResult: FirstPassResult): SecondPassResult {
    const { target, config } = this;
    const { tree } = firstPassResult;
    const { labels, nodesOffsets, equ } = firstPassResult;

    const result = new SecondPassResult(0x0, labels);
    let success = false;
    let needSort = false;
    const sectionStartOffset = this._origin; // todo: add multiple sections support?

    /**
     * Lookups into tree and resolves nested label args
     *
     * @see
     *  instructionIndex must be equal count of instructions in first phase!
     */
    function labelResolver(
      astNode: ASTAsmNode,
      instructionOffset: number,
    ): ASTLabelAddrResolver {
      return (name: string): number => {
        // handle case mov ax, [b] where [b] is unknown during compile time
        if (astNode instanceof ASTInstruction) {
          astNode.labeledInstruction = true;
        }

        if (sectionStartOffset !== null && name === MAGIC_LABELS.SECTION_START) {
          return sectionStartOffset;
        }

        if (name === MAGIC_LABELS.CURRENT_LINE) {
          return instructionOffset;
        }

        if (equ.has(name)) {
          return equ.get(name).getValue() ?? 0;
        }

        if (isLocalLabel(name)) {
          name = resolveLocalTokenAbsName(tree, name, R.indexOf(astNode, tree.astNodes));
        }

        if (config.externalLinkerAddrGenerator && isExternalLinkerSymbol(name)) {
          return config.externalLinkerAddrGenerator({
            name,
            instructionOffset,
          });
        }

        return labels.get(name);
      };
    }

    /**
     * Resizes all block after offset which is enlarged
     */
    function resizeBlockAtOffset(offset: number, enlarge: number): void {
      // if so decrement precceding instruction offsets and label offsets
      for (const [label, labelOffset] of labels) {
        if (labelOffset > offset) {
          labels.set(label, labelOffset + enlarge);
        }
      }

      // if so decrement precceding instruction offsets and label offsets
      const offsetsArray = Array.from(nodesOffsets);
      for (const [instructionOffset] of offsetsArray) {
        if (instructionOffset > offset) {
          nodesOffsets.delete(instructionOffset);
        }
      }

      for (const [instructionOffset, nextInstruction] of offsetsArray) {
        if (instructionOffset > offset) {
          nodesOffsets.set(instructionOffset + enlarge, nextInstruction);
        }
      }
    }

    /**
     * Appends blobs map at current offset to nodesOffsets
     */
    function appendBlobsAtOffset(offset: number, blobs: BinaryBlobsMap): void {
      needSort = true;
      for (const [blobOffset, blob] of blobs) {
        nodesOffsets.set(offset + blobOffset, blob);
      }
    }

    /**
     * Process EQU, returns true if value changed
     */
    function passEqu(offset: number, blob: BinaryEqu): boolean {
      const prevValue = blob.getValue();

      // ignore, it is propably already resolved
      if (!blob.isLabeled()) {
        return false;
      }

      blob.pass(labelResolver(blob.getAST(), offset));

      return prevValue !== blob.getValue() || R.isNil(prevValue);
    }

    /**
     * Definition might contain something like it:
     * db 0xFF, (label+2), 0xFE
     * its tries to resolve second arg
     */
    function passDefinition(offset: number, blob: BinaryDefinition): boolean {
      return (
        blob.hasUnresolvedDefinitions() &&
        !blob.tryResolveOffsets(labelResolver(blob.getAST(), offset))
      );
    }

    // proper resolve labels
    for (let pass = 0; pass < this.config.maxPasses; ++pass) {
      let needPass = false;

      // eslint-disable-next-line prefer-const
      for (let [offset, blob] of nodesOffsets) {
        try {
          // check for slave blobs (0 bytes instructions, EQU)
          if (blob.slaveBlobs) {
            const { slaveBlobs: slaves } = blob;

            for (let slaveIndex = 0; slaveIndex < slaves.length; ++slaveIndex) {
              const slave = slaves[slaveIndex];

              if (slave instanceof BinaryEqu) {
                if (passEqu(offset, slave)) {
                  needPass = true;
                }
              } else {
                throw new ParserError(
                  ParserErrorCode.INCORRECT_SLAVE_BLOBS,
                  blob.getAST().loc.start,
                );
              }
            }
          }

          if (blob instanceof BinaryDefinition) {
            if (passDefinition(offset, blob)) {
              needPass = true;
            } else {
              continue;
            }
          } else if (blob instanceof BinaryEqu) {
            // ignore, it is propably already resolved
            if (passEqu(offset, blob)) {
              needPass = true;
            } else {
              continue;
            }
          } else if (blob instanceof BinaryRepeatedNode) {
            // repeats instruction nth times
            const blobResult = blob.pass(
              this,
              offset - this._origin,
              labelResolver(blob.getAST(), offset),
            );

            const blobSize = blobResult.getByteSize();

            // prevent loop, kill times
            nodesOffsets.delete(offset);
            resizeBlockAtOffset(offset, blobSize - 1);

            if (blobSize) {
              appendBlobsAtOffset(0, blobResult.nodesOffsets);
              needPass = true;
              break;
            }
          } else if (blob instanceof BinaryInstruction) {
            const ast = blob.getAST();
            const pessimisticSize = blob.byteSize;

            // generally check for JMP/CALL etc instructions
            // and all args have defined values
            if (ast.isConstantSize()) {
              continue;
            }

            // matcher must choose which instruction to match
            // based on origin it must choose between short relative
            // jump and long
            ast.tryResolveSchema(labelResolver(ast, offset), offset, target);

            // single instruction might contain multiple schemas but never 0
            const { schemas } = ast;
            if (!schemas.length) {
              throw new ParserError(
                ParserErrorCode.UNKNOWN_COMPILER_INSTRUCTION,
                ast.loc.start,
                {
                  instruction: ast.toString(),
                },
              );
            }

            // check if instruction after replacing labels has been shrinked
            // if so - force rewrite precceding instrutions and labels
            const recompiled = new BinaryInstruction(ast).compile(this, offset);
            const shrinkBytes = pessimisticSize - recompiled.byteSize;
            if (shrinkBytes) {
              needPass = true;
              ast.unresolvedArgs = true;

              nodesOffsets.set(offset, recompiled);
              resizeBlockAtOffset(offset, -shrinkBytes);
            }

            // select first schema, it will be discarded if next instruction have label
            ast.schemas = [ast.schemas[0]];
          }
        } catch (e) {
          e.loc = e.loc ?? blob.getAST()?.loc?.start;

          throw e;
        }
      }

      if (!needPass) {
        success = true;
        break;
      } else {
        result.totalPasses = pass + 1;
      }
    }

    // exhaust tries count
    if (!success) {
      throw new ParserError(ParserErrorCode.UNABLE_TO_COMPILE_FILE);
    }

    // produce binaries
    const orderedOffsets = needSort
      ? Array.from(nodesOffsets).sort((a, b) => a[0] - b[0])
      : nodesOffsets;

    for (const [offset, blob] of orderedOffsets) {
      let compiled = blob;

      if (blob instanceof BinaryInstruction) {
        compiled = blob.compile(this, offset);
      }

      if (blob.getBinary()) {
        result.byteSize = Math.max(
          result.byteSize,
          offset + blob.byteSize - this._origin,
        );
        result.blobs.set(offset, compiled);
      }
    }

    return result;
  }

  /**
   * Transform provided AST nodes array into binary blobs
   */
  compile(): E.Either<CompilerError[], SecondPassResult> {
    if (!this.tree) {
      return null;
    }

    try {
      return E.right(this.secondPass(this.firstPass()));
    } catch (e) {
      return E.left([e]);
    }
  }
}
