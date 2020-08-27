import {registerDecorator, ValidationOptions} from 'class-validator';
import * as R from 'ramda';

const MIN_TAG_LENGTH = 1;
const MAX_TAG_LENGTH = 40;

export function IsTagCorrect(validationOptions?: ValidationOptions) {
  return (object: Object, propertyName: string) => {
    registerDecorator({
      name: 'isLongerThan',
      target: object.constructor,
      propertyName,
      options: {
        message: `tag should not contain spaces and should hass less than ${MAX_TAG_LENGTH} characters`,
        ...validationOptions,
      },
      validator: {
        validate(value: any) {
          return (
            value
              && !R.includes(' ', value)
              && value.length >= MIN_TAG_LENGTH
              && value.length <= MAX_TAG_LENGTH
          );
        },
      },
    });
  };
}
