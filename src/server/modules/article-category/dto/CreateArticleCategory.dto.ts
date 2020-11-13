import {MaxLength, MinLength} from 'class-validator';
import {IsUniqueValue} from '@server/validators/IsUniqueValue';

export class CreateArticleCategoryDto {
  @IsUniqueValue(
    {
      repository: 'ArticleCategoryEntity',
      message: 'Category with provided name already exists!',
    },
  )
  @MinLength(2)
  @MaxLength(140)
  readonly name: string;

  constructor(partial: Partial<CreateArticleCategoryDto>) {
    Object.assign(this, partial);
  }
}
