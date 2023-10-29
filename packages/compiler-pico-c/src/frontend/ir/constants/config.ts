import { CCompilerArch } from '#constants';
import { IROptimizerConfig } from '../optimizer/constants/types';

export type IRGeneratorConfig = {
  arch: CCompilerArch;
  optimization: IROptimizerConfig;
};
