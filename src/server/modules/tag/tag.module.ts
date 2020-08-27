import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';

import {Tag} from './tag.entity';
import {TagService} from './tag.service';

@Module(
  {
    imports: [
      TypeOrmModule.forFeature([Tag]),
    ],
    exports: [
      TypeOrmModule,
      TagService,
    ],
    providers: [
      TagService,
    ],
  },
)
export class TagModule {}
