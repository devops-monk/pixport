import { forwardRef, type ButtonHTMLAttributes } from 'react'
import clsx from 'clsx'

type Variant = 'primary' | 'secondary' | 'plain' | 'glass'
type Size = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-accent-ink hover:brightness-110 active:brightness-95 disabled:opacity-40',
  secondary: 'bg-surface-2 text-ink hover:bg-surface-3 disabled:opacity-40',
  plain: 'text-accent hover:bg-accent-soft disabled:opacity-40',
  glass: 'bg-glass text-ink backdrop-blur-xl shadow-soft hover:bg-surface disabled:opacity-40',
}

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3.5 text-[13px] gap-1.5',
  md: 'h-10 px-5 text-[15px] gap-2',
  lg: 'h-12 px-7 text-[17px] gap-2',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', className, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={clsx(
        'inline-flex shrink-0 items-center justify-center rounded-full font-medium tracking-[-0.01em] whitespace-nowrap transition-[background,filter,transform] duration-200 active:scale-[0.97] disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    />
  )
})

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
}

export function IconButton({ label, className, children, type = 'button', ...rest }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={clsx(
        'inline-flex size-9 shrink-0 items-center justify-center rounded-full text-ink transition-colors hover:bg-surface-2 active:bg-surface-3 disabled:pointer-events-none disabled:opacity-30',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
