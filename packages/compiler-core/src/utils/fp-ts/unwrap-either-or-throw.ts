import * as E from 'fp-ts/Either';

export const unwrapEitherOrThrow = <L, R>(either: E.Either<L, R>) => {
  if (E.isLeft(either)) {
    throw either.left;
  }

  return either.right;
};
