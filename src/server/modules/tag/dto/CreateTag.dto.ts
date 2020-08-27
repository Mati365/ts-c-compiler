import {IsTagCorrect} from '../validators/IsTagCorrect';

export class CreateTagDto {
  @IsTagCorrect()
  readonly name: string;

  constructor(partial: Partial<CreateTagDto>) {
    Object.assign(this, partial);
  }
}
