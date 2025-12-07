// src/components/ui/Input/Input.tsx

import React from 'react';
import styles from './Input.module.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const containerClasses = [
      styles.container,
      fullWidth && styles.fullWidth,
      className
    ].filter(Boolean).join(' ');

    const inputWrapperClasses = [
      styles.inputWrapper,
      error && styles.error,
      disabled && styles.disabled,
      leftIcon && styles.hasLeftIcon,
      rightIcon && styles.hasRightIcon
    ].filter(Boolean).join(' ');

    return (
      <div className={containerClasses}>
        {label && (
          <label className={styles.label}>
            {label}
            {props.required && <span className={styles.required}>*</span>}
          </label>
        )}
        
        <div className={inputWrapperClasses}>
          {leftIcon && <span className={styles.leftIcon}>{leftIcon}</span>}
          
          <input
            ref={ref}
            className={styles.input}
            disabled={disabled}
            {...props}
          />
          
          {rightIcon && <span className={styles.rightIcon}>{rightIcon}</span>}
        </div>

        {error && <span className={styles.errorText}>{error}</span>}
        {helperText && !error && <span className={styles.helperText}>{helperText}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';