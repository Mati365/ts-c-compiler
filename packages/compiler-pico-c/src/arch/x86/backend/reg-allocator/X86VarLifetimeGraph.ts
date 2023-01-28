import { last } from 'ramda';

// import { isOutputInstruction } from '@compiler/pico-c/frontend/ir/interfaces';
import { isIRBranchInstruction } from '@compiler/pico-c/frontend/ir/guards';
import { isIRVariable } from '@compiler/pico-c/frontend/ir/variables';

import { Range } from '@compiler/core/types';
import { IRInstruction } from '@compiler/pico-c/frontend/ir/instructions';

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
      } else {
        lastVarGraph.to = offset;
      }
    };

    for (let offset = 0; offset < instructions.length; ++offset) {
      const instruction = instructions[offset];

      if (isIRBranchInstruction(instruction)) {
        branchOccurred = true;
        continue;
      }

      // if (isOutputInstruction(instruction)) {
      //   const { outputVar } = instruction;
      //   if (outputVar) {
      //     trackVariableUsage(offset, outputVar.name);
      //   }
      // }

      for (const inputArg of instruction.getArgs().input) {
        if (!isIRVariable(inputArg)) {
          continue;
        }

        trackVariableUsage(offset, inputArg.name);
      }
    }

    return newGraph;
  }

  getGraph() {
    return this.graph;
  }

  isVariableLaterUsed(offset: number, varName: string): boolean {
    const varGraph = this.graph[varName];

    if (!varGraph?.length) {
      return false;
    }

    return last(varGraph).to - offset > 0;
  }
}
