'use client';

import classNames from 'classnames';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { textSmall, textSmallBold } from '#app/theme.css';
import useOnClickOutside from '#hooks/useOnClickOutside';
import * as selectStyles from './Select.css';
import type { ReactNode } from 'react';

export type Option<T extends number | string> = {
  value: T;
  label: string;
  selectLabel?: string;
  left?: ReactNode;
  right?: ReactNode;
};

type ItemProps<T extends number | string> = {
  option: Option<T>;
  iconWidth: number;
  iconHeight: number;
  onSelect?: (value: T) => void;
  label?: string;
  rightLabel?: string;
  isSelected?: boolean;
};

const Item = ({
  label,
  option,
  iconWidth,
  iconHeight,
  isSelected,
  onSelect,
}: ItemProps<number | string>) => {
  return (
    <div
      role="button"
      className={selectStyles.itemContainer}
      onClick={() => {
        onSelect?.(option.value);
      }}
    >
      {option?.left && (
        <div className={selectStyles.imgContainer}>
          {(typeof option?.left === 'string' && (
            <Image
              src={option?.left as string}
              alt={option?.label}
              width={iconWidth}
              height={iconHeight}
              unoptimized
            />
          )) ||
            option?.left}
        </div>
      )}
      {label !== '' && (
        <div
          className={classNames(
            selectStyles.itemLabel,
            isSelected ? textSmallBold : textSmall,
          )}
        >
          {label || option?.label}
        </div>
      )}
      {!isSelected && option?.right && (
        <div className={selectStyles.imgContainer}>
          {(typeof option?.left === 'string' && (
            <Image
              src={option?.right as string}
              alt={option?.label}
              width={iconWidth}
              height={iconHeight}
            />
          )) ||
            option?.right}
        </div>
      )}
    </div>
  );
};

export type Props<T extends number | string> = {
  value?: T;
  options: Array<Option<T>>;
  onChange: (value: T) => void;
  onClick?: () => void;
  children?: React.ReactNode;
  iconWidth?: number;
  iconHeight?: number;
  disableSelect?: boolean;
  isActive?: boolean;
  className?: string;
  openBoxClassName?: string;
  childrenOnTop?: boolean;
};

const Select = <T extends number | string>({
  value,
  options = [],
  iconWidth = 19,
  iconHeight = 30,
  disableSelect,
  onChange,
  onClick,
  children,
  isActive,
  className,
  openBoxClassName,
  childrenOnTop = false,
}: Props<T>) => {
  const intl = useIntl();
  const ref = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(true);

  const containerRef = useOnClickOutside<HTMLDivElement>(() => {
    setIsOpen(false);
  });

  useEffect(() => {
    if (
      (typeof value === 'undefined' || value === null) &&
      options.length > 0
    ) {
      onChange(options[0].value);
    }
    setIsOpen(false);
  }, [onChange, options, value]);

  const selected = options.find(({ value: val }) => val === value);

  return (
    <div
      ref={containerRef}
      className={classNames(selectStyles.container, className)}
    >
      <div
        ref={ref}
        role="button"
        className={classNames(
          selectStyles.selectContainer,
          isActive && selectStyles.buttonActive,
        )}
        onClick={() => {
          if (disableSelect) {
            onClick?.();
          } else if (options.length > 0) {
            setIsOpen(open => !open);
          }
        }}
      >
        {selected ? (
          <Item
            option={selected}
            iconWidth={iconWidth}
            iconHeight={iconHeight}
            isSelected
            label={
              selected.selectLabel !== undefined
                ? selected.selectLabel
                : selected.label
            }
          />
        ) : (
          children || (
            <div className={classNames(selectStyles.itemContainer, textSmall)}>
              {intl.formatMessage({
                id: 'MeyiTp',
                defaultMessage: 'No data',
                description: 'placeholder if no options',
              })}
            </div>
          )
        )}
        {options.length > 0 && (
          <div className={selectStyles.arrow}>
            <Image
              src="/arrow_down.svg"
              alt="arrow_down"
              width={16}
              height={16}
            />
          </div>
        )}
      </div>
      {isOpen && (
        <div
          className={classNames(selectStyles.openedContainer, openBoxClassName)}
          style={{
            top: ref.current?.getBoundingClientRect().height || 0,
            width: ref.current?.getBoundingClientRect().width,
          }}
        >
          {children && childrenOnTop && (
            <div className={selectStyles.bottomItem}>{children}</div>
          )}
          <div className={classNames(selectStyles.listItemContainer)}>
            {options.map(option => (
              <Item
                key={option.value}
                isSelected={option.value === selected?.value}
                option={option}
                iconWidth={iconWidth}
                iconHeight={iconHeight}
                onSelect={() => {
                  setIsOpen(false);
                  onChange(option.value);
                }}
              />
            ))}
          </div>
          {children && !childrenOnTop && (
            <div className={selectStyles.bottomItem}>{children}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default Select;
