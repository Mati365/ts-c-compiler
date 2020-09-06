import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';

import {isDevBuild} from '@ui/webapp/utils/isDevBuild';

import {Tag} from '@server/modules/tag/tag.entity';
import {
  Project,
  CompilerInput,
} from '@server/modules/project/entities';

const {
  DB_NAME,
  DB_HOST,
  DB_USER,
  DB_PASS,
  DB_PORT,
} = process.env;

@Module(
  {
    imports: [
      TypeOrmModule.forRoot(
        {
          type: 'postgres',
          database: DB_NAME,
          host: DB_HOST,
          username: DB_USER,
          password: DB_PASS,
          port: +DB_PORT,
          synchronize: true,
          logging: (
            isDevBuild()
              ? 'all'
              : false
          ),
          entities: [
            Project,
            CompilerInput,
            Tag,
          ],
        },
      ),
    ],
  },
)
export class DatabaseModule {}
