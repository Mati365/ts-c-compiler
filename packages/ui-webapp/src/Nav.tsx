import React, {ReactElement, ReactNode} from 'react';
import * as R from 'ramda';
import c from 'classnames';
import {linkInputs, LinkProps} from './decorators/linkInputs';

type NavProps = LinkProps<string> & {
  className?: string,
  children: ReactNode,
};

export const Nav = linkInputs<string>()(({children, className, value, l}: NavProps) => {
  const activeTab: ReactElement<NavTabProps> = R.find(
    ({props}) => props.id === value || R.isNil(value),
    React.Children.toArray(children) as ReactElement<NavTabProps>[],
  );

  return (
    <div className={c('c-nav', className)}>
      <ul className='c-nav__list'>
        {React.Children.map(
          children,
          (child: ReactElement<NavTabProps>) => React.cloneElement(
            child,
            {
              active: child.props.id === activeTab.props.id,
              onClick: () => l.setValue(child.props.id),
            },
          ),
        )}
      </ul>

      <div className='c-nav__content'>
        {activeTab.props.children()}
      </div>
    </div>
  );
});

Nav.displayName = 'Nav';

type NavTabProps = {
  id: string,
  title: ReactNode,
  children(): ReactNode,
  active?: boolean,
  className?: string,
  onClick?(): void;
};

export const NavTab = ({title, className, active, onClick}: NavTabProps) => (
  // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
  <li
    className={c(
      'c-nav__tab',
      active && 'is-active',
      className,
    )}
    onClick={onClick}
  >
    {title}
  </li>
);

NavTab.displayName = 'NavTab';
