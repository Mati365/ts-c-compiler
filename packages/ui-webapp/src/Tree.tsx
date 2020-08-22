import React, {ReactNode} from 'react';
import c from 'classnames';
import * as R from 'ramda';

type TreeProps = {
  className?: string,
  children: ReactNode,
  nested?: boolean,
};

export const Tree = ({className, nested, children}: TreeProps) => (
  <ul
    className={c(
      'o-tree',
      nested && 'is-nested',
      className,
    )}
  >
    {children}
  </ul>
);

type TreeItemProps = {
  label: ReactNode,
  value?: ReactNode,
  className?: string,
  children?: ReactNode,
  bold?: boolean,
};

export const TreeLabeledItem = ({label, value, className, bold, children}: TreeItemProps) => (
  <li
    className={c(
      'o-tree__item',
      className,
    )}
  >
    <span
      className={c(
        'o-tree__label',
        bold && 'text-bold',
      )}
    >
      {label}
    </span>
    {!R.isNil(value) && (
      <span className='o-tree__value'>{value}</span>
    )}
    {children}
  </li>
);
