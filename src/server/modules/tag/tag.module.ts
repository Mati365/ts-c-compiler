import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';

import {TagEntity} from './Tag.entity';
import {TagService} from './Tag.service';

@Module(
  {
    imports: [
      TypeOrmModule.forFeature([TagEntity]),
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
