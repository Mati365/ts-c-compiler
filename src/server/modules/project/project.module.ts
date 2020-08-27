import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';

import {TagModule} from '../tag/tag.module';
import {CompilerInput, Project} from './entities';
import {ProjectController} from './project.controller';
import {ProjectService} from './project.service';

@Module(
  {
    imports: [
      TypeOrmModule.forFeature([Project, CompilerInput]),
      TagModule,
    ],
    providers: [
      ProjectService,
    ],
    controllers: [
      ProjectController,
    ],
  },
)
export class ProjectModule {}
