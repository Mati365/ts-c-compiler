import { last } from 'ramda';

import { isOutputInstruction } from 'frontend/ir/interfaces';
import { isIRBranchInstruction } from 'frontend/ir/guards';
import { isIRVariable } from 'frontend/ir/variables';

import { Range } from '@ts-c/core';
import { IRInstruction } from 'frontend/ir/instructions';

type X86VarLifetimeOffset = Range;
type X86VarGraph = Record<string, X86VarLifetimeOffset[]>;

export class X86VarLifetimeGraph {
  private readonly graph: X86VarGraph;

  constructor(private readonly instructions: IRInstruction[]) {
    this.graph = this.createGraph();
  }

  private createGraph(): X86VarGraph {
    const { instructions } = this;
    const newGraph: X86VarGraph = {};

    let branchOccurred = false;

    const trackVariableUsage = (offset: number, name: string) => {
      const varGraph = (newGraph[name] ||= []);
      const lastVarGraph = last(varGraph);

      if (branchOccurred || !lastVarGraph) {
        varGraph.push({
          from: offset,
          to: offset,
        });

        branchOccurred = false;
      } else {
        lastVarGraph.to = offset;
      }
    };

    const trackInstructionInputs = (
      offset: number,
      instruction: IRInstruction,
    ) => {
      for (const inputArg of instruction.getArgs().input) {
        if (!isIRVariable(inputArg)) {
          continue;
        }

        trackVariableUsage(offset, inputArg.name);
      }
    };

    for (let offset = 0; offset < instructions.length; ++offset) {
      const instruction = instructions[offset];

      if (isIRBranchInstruction(instruction)) {
        branchOccurred = true;
        trackInstructionInputs(offset, instruction);
        continue;
      }

      if (isOutputInstruction(instruction)) {
        const { outputVar } = instruction;
        if (outputVar) {
          trackVariableUsage(offset, outputVar.name);
        }
      }

      trackInstructionInputs(offset, instruction);
    }

    return newGraph;
  }

  getGraph() {
    return this.graph;
  }

  isVariableLaterUsed(
    offset: number,
    varName: string,
    exclusive: boolean = true,
  ): boolean {
    const varGraph = this.graph[varName];

    if (!varGraph?.length) {
      return false;
    }

    const delta = last(varGraph).to - offset;

    return exclusive ? delta > 0 : delta >= 0;
  }
}
