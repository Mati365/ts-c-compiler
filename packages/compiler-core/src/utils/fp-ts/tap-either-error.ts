import { pipe } from 'fp-ts/function';
import * as E from 'fp-ts/Either';

export const tapEitherError =
  <E, A>(onLeft?: (error: E) => void) =>
  (task: E.Either<E, A>): E.Either<E, A> =>
    pipe(
      task,
      E.fold(error => {
        onLeft?.(error);
        return E.left(error);
      }, E.right),
    );
