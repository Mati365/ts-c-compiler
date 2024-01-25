import { Identity } from '@ts-c-compiler/core';

export type CBinaryLabel = {
  name: string;
  offset: number;
};

export type CBinaryLabelsMap = Record<string, CBinaryLabel>;

type CBinaryObjectOutputDescriptor = {
  srcFile: string;
  binary: number[];
  externLabels: {
    size: number;
    map: CBinaryLabelsMap;
  };
};

export class CBinaryObjectOutput extends Identity<CBinaryObjectOutputDescriptor> {}
