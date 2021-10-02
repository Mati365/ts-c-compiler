import {DynamicModule, Module} from '@nestjs/common';
import {
  ManifestService,
  ManifestConfig,
  MANIFEST_CONFIG,
} from './Manifest.service';

@Module({})
export class ManifestModule {
  static forRoot(config: ManifestConfig): DynamicModule {
    return {
      module: ManifestModule,
      providers: [
        {
          provide: MANIFEST_CONFIG,
          useValue: config,
        },
        ManifestService,
      ],
      exports: [ManifestService],
    };
  }
}
