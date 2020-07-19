import React, {ReactNode} from 'react';
import c from 'classnames';

export enum CardType {
  SECONDARY = 'secondary',
  PRIMARY = 'primary',
}

export type CardProps = JSX.IntrinsicElements['div'] & {
  headerClassName?: string,
  contentClassName?: string,

  type?: CardType,
  header?: ReactNode,
  contentSpaced?: boolean,
  rounded?: boolean,
  bordered?: boolean,
};

export const Card = (
  {
    headerClassName, contentClassName,
    header, type = CardType.SECONDARY,
    rounded = true, bordered = true, contentSpaced = true,
    className, children, ...props
  }: CardProps,
) => (
  <div
    className={c(
      'c-card',
      {
        'is-rounded': rounded,
        'is-bordered': bordered,
      },
      className,
    )}
    {...props}
  >
    {header && (
      <div
        className={c(
          'c-card-header',
          `is-${type}`,
          headerClassName,
        )}
      >
        {header}
      </div>
    )}
    <div
      className={c(
        'c-card-content',
        {
          'is-spaced': contentSpaced,
        },
        contentClassName,
      )}
    >
      {children}
    </div>
  </div>
);

Card.displayName = 'Card';
