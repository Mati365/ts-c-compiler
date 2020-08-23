import * as fs from 'fs';
import {Injectable, Inject} from '@nestjs/common';

export const MANIFEST_CONFIG = 'MANIFEST_CONFIG';

export type ManifestConfig = {
  filePath: string,
};

export type ManifestContent = Record<string, string>;

@Injectable()
export class ManifestService {
  private manifest: ManifestContent = null;

  constructor(@Inject(MANIFEST_CONFIG) config: ManifestConfig) {
    try {
      this.manifest = JSON.parse(fs.readFileSync(config.filePath, 'utf-8'));
    } catch (e) {
      console.error(e);
    }
  }

  get(key: string): string {
    return this.manifest[key];
  }
}
