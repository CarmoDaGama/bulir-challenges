import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 disabled:pointer-events-none disabled:opacity-60 active:scale-[0.99]',
  {
    variants: {
      variant: {
        primary:
          'bg-gradient-to-r from-cyan-300 to-teal-300 text-slate-900 hover:scale-[1.02] hover:shadow-[0_10px_35px_-15px_rgba(103,232,249,0.9)]',
        ghost: 'border border-cyan-100/20 bg-slate-900/40 text-slate-100 hover:scale-[1.02] hover:bg-slate-800/60',
        danger: 'border border-rose-300 bg-rose-100 text-rose-800 hover:scale-[1.02] hover:bg-rose-200',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3',
        lg: 'h-11 px-6',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
