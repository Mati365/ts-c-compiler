import {IsTagCorrect} from '@server/modules/tag/validators/IsTagCorrect';
import {IsUniqueValue} from '@server/validators/IsUniqueValue';
import {Type} from 'class-transformer';
import {
  Length, ValidateNested, IsDefined,
  ArrayMinSize, ArrayMaxSize, MinLength,
} from 'class-validator';

import {CreateCompilerInputDto} from './CreateCompilerInput.dto';

export class CreateProjectDto {
  @IsUniqueValue(
    {
      repository: 'Project',
    },
  )
  @Length(4, 200)
  readonly title: string;

  @MinLength(10)
  readonly description: string;

  @ValidateNested()
  @IsDefined()
  @Type(() => CreateCompilerInputDto)
  readonly input: CreateCompilerInputDto;

  @ArrayMinSize(1)
  @ArrayMaxSize(15)
  @IsTagCorrect(
    {
      each: true,
    },
  )
  readonly tags: string[];
}
