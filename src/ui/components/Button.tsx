import React from 'react';
import clsx from 'clsx';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconOnly?: boolean;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'secondary', size = 'md', icon, iconOnly, fullWidth, children, style, ...props }, ref) => {
    
    const baseClasses = `inline-flex items-center justify-center font-interface font-semibold rounded-[8px] transition-all duration-120 outline-none focus-visible:outline-2 focus-visible:outline-offset-2`;
    
    const variantClass = `btn-${variant}`;
    const sizeClass = iconOnly ? `btn-icon-${size}` : `btn-${size}`;

    return (
      <button 
        ref={ref} 
        className={clsx('vault-btn', variantClass, sizeClass, className)} 
        style={{ width: fullWidth ? '100%' : undefined, ...style }}
        {...props}
      >
        {icon && <span className={clsx("btn-icon", children && "mr-2")}>{icon}</span>}
        {!iconOnly && children}
      </button>
    );
  }
);
Button.displayName = 'Button';
