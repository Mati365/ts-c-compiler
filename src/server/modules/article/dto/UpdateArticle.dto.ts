import {IsUniqueValue} from '@server/validators/IsUniqueValue';
import {IsDefined, Length} from 'class-validator';
import {CreateArticleDto} from './CreateArticle.dto';

export class UpdateArticleDto extends CreateArticleDto {
  readonly id: number;

  @IsDefined()
  @IsUniqueValue(
    {
      repository: 'ArticleEntity',
      message: 'Article with provided name already exists!',
      queryBuilderMapper({query, obj}) {
        return query.andWhere(
          'id != :id',
          {
            id: (<UpdateArticleDto> obj).id,
          },
        );
      },
    },
  )
  @Length(4, 200)
  readonly title: string;

  /* eslint-disable @typescript-eslint/no-useless-constructor */
  constructor(partial: Partial<UpdateArticleDto>) {
    super(partial);
  }
  /* eslint-enable @typescript-eslint/no-useless-constructor */
}
