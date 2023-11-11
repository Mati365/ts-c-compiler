import { pipe } from 'fp-ts/function';
import * as E from 'fp-ts/Either';

export const tapEither =
  <E, A>(onRight: (data: A) => void, onLeft?: (error: E) => void) =>
  (task: E.Either<E, A>): E.Either<E, A> =>
    pipe(
      task,
      E.fold(
        error => {
          onLeft?.(error);
          return E.left(error);
        },
        data => {
          onRight(data);
          return E.right(data);
        },
      ),
    );
