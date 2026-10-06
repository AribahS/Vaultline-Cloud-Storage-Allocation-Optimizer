import React from 'react';
import clsx from 'clsx';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconOnly?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'secondary', size = 'md', icon, iconOnly, children, ...props }, ref) => {
    
    const baseClasses = `inline-flex items-center justify-center font-interface font-semibold rounded-[8px] transition-all duration-120 outline-none focus-visible:outline-2 focus-visible:outline-offset-2`;
    
    // Style variants (since we aren't using Tailwind, we just map classes that we'll add to index.css or use inline styles, 
    // actually it's better to add these utility classes to index.css or just use style object).
    // Let's use simple CSS classes and update index.css to match.
    const variantClass = `btn-${variant}`;
    const sizeClass = iconOnly ? `btn-icon-${size}` : `btn-${size}`;

    return (
      <button 
        ref={ref} 
        className={clsx('vault-btn', variantClass, sizeClass, className)} 
        {...props}
      >
        {icon && <span className={clsx("btn-icon", children && "mr-2")}>{icon}</span>}
        {!iconOnly && children}
      </button>
    );
  }
);
Button.displayName = 'Button';

