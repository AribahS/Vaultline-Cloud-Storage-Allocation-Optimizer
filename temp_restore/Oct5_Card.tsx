import React from 'react';
import clsx from 'clsx';

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(className)}
        style={{
          backgroundColor: 'var(--color-surface-raised)',
          border: '1px solid var(--color-border-hairline)',
          borderRadius: 'var(--radius-card)',
          boxShadow: 'var(--shadow-soft-sm)',
          padding: '24px',
          ...(props.style || {}),
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';

