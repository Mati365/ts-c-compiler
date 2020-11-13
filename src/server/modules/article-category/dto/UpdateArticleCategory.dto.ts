import {CreateArticleCategoryDto} from './CreateArticleCategory.dto';

export class UpdateArticleCategoryDto extends CreateArticleCategoryDto {
  readonly id: number;

  /* eslint-disable @typescript-eslint/no-useless-constructor */
  constructor(partial: Partial<UpdateArticleCategoryDto>) {
    super(partial);
  }
  /* eslint-enable @typescript-eslint/no-useless-constructor */
}
