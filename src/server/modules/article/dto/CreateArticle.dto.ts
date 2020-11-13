import {
  Length,
  ArrayMaxSize, MinLength,
  IsDefined, IsNumber,
  IsOptional, IsBoolean, IsString,
} from 'class-validator';

import {IsTagCorrect} from '@server/modules/tag/validators/IsTagCorrect';
import {IsUniqueValue} from '@server/validators/IsUniqueValue';

export class CreateArticleDto {
  @IsDefined()
  @IsUniqueValue(
    {
      repository: 'ArticleEntity',
      message: 'Article with provided name already exists!',
    },
  )
  @Length(4, 200)
  readonly title: string;

  @IsString()
  readonly lead: string;

  @IsDefined()
  @MinLength(3)
  readonly content: string;

  @IsOptional()
  @ArrayMaxSize(15)
  @IsTagCorrect(
    {
      each: true,
    },
  )
  readonly tags: string[];

  @IsOptional()
  @IsBoolean()
  readonly visible: boolean;

  @IsOptional()
  @IsNumber()
  readonly categoryId: number;

  @IsNumber()
  readonly userId: number;

  @IsNumber()
  readonly coverAttachmentId: number;

  constructor(partial: Partial<CreateArticleDto>) {
    Object.assign(this, partial);
  }
}
