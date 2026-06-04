import React, { InputHTMLAttributes, forwardRef, ReactNode } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  containerClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className = '',
      type = 'text',
      label,
      error,
      helperText,
      startIcon,
      endIcon,
      containerClassName = '',
      id,
      ...props
    },
    ref
  ) => {
    return (
      <div className={`flex flex-col w-full gap-1.5 ${containerClassName}`}>
        {label && (
          <label
            htmlFor={id}
            className="text-xs font-semibold text-[#243B53] tracking-wide select-none"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {startIcon && (
            <span className="absolute left-3.5 z-10 flex items-center justify-center pointer-events-none text-gray-400">
              {startIcon}
            </span>
          )}
          <input
            ref={ref}
            id={id}
            type={type}
            className={`w-full bg-[#F4F7FA] text-[#1F2933] placeholder:text-gray-400 text-sm font-medium rounded-lg border transition-all duration-150 ease-in-out outline-none
              ${startIcon ? 'pl-11' : 'pl-4'}
              ${endIcon ? 'pr-11' : 'pr-4'}
              py-2.5
              ${
                error
                  ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100'
                  : 'border-gray-300 focus:border-[#5BA4A4] focus:ring-4 focus:ring-[#5BA4A4]/15 focus:bg-white'
              }
              ${className}`}
            {...props}
          />
          {endIcon && (
            <span className="absolute right-3.5 z-10 flex items-center justify-center text-gray-400">
              {endIcon}
            </span>
          )}
        </div>
        {error && (
          <span className="text-xs font-medium text-red-500 animate-fadeIn select-none">
            {error}
          </span>
        )}
        {!error && helperText && (
          <span className="text-xs text-gray-400 select-none">
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
