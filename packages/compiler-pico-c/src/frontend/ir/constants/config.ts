import { CCompilerArch } from '@compiler/pico-c/constants';
import { IROptimizerConfig } from '../optimizer/constants/types';

export type IRGeneratorConfig = {
  arch: CCompilerArch;
  optimization: IROptimizerConfig;
};
