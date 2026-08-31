import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default'|'destructive'|'outline'|'secondary'|'ghost'|'link'
  size?: 'default'|'sm'|'lg'|'icon'
}
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({className, variant='default', size='default', ...props}, ref) => {
  const base = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 disabled:pointer-events-none disabled:opacity-50"
  const variants: Record<string,string> = {
    default: "bg-violet-600 text-white hover:bg-violet-700 shadow-lg shadow-violet-600/20",
    destructive: "bg-red-600 text-white hover:bg-red-700",
    outline: "border border-zinc-700 bg-transparent hover:bg-zinc-800 text-zinc-200",
    secondary: "bg-zinc-800 text-zinc-100 hover:bg-zinc-700",
    ghost: "hover:bg-zinc-800 hover:text-white text-zinc-400",
    link: "text-violet-400 underline-offset-4 hover:underline",
  }
  const sizes: Record<string,string> = {
    default: "h-10 px-5 py-2",
    sm: "h-8 rounded-lg px-3 text-xs",
    lg: "h-12 rounded-xl px-8 text-base",
    icon: "h-10 w-10",
  }
  return <button ref={ref} className={cn(base, variants[variant], sizes[size], className)} {...props} />
})
Button.displayName="Button"
export { Button }

export function Badge({className, variant='default', ...props}: React.HTMLAttributes<HTMLDivElement> & {variant?:'default'|'secondary'|'destructive'|'outline'|'success'|'warning'}){
  const v: Record<string,string> = {
    default:"bg-violet-600 text-white", secondary:"bg-zinc-800 text-zinc-300",
    destructive:"bg-red-600 text-white", outline:"border border-zinc-700 text-zinc-400",
    success:"bg-emerald-600 text-white", warning:"bg-amber-500 text-black",
  }
  return <div className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", v[variant], className)} {...props} />
}
export function Card({className,...props}: React.HTMLAttributes<HTMLDivElement>){
  return <div className={cn("rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur text-zinc-100 shadow-xl", className)} {...props} />
}
export function CardHeader({className,...props}: React.HTMLAttributes<HTMLDivElement>){
  return <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
}
export function CardTitle({className,...props}: React.HTMLAttributes<HTMLHeadingElement>){
  return <h3 className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />
}
export function CardDescription({className,...props}: React.HTMLAttributes<HTMLParagraphElement>){
  return <p className={cn("text-sm text-zinc-400", className)} {...props} />
}
export function CardContent({className,...props}: React.HTMLAttributes<HTMLDivElement>){
  return <div className={cn("p-6 pt-0", className)} {...props} />
}
export function CardFooter({className,...props}: React.HTMLAttributes<HTMLDivElement>){
  return <div className={cn("flex items-center p-6 pt-0", className)} {...props} />
}
export function Input({className, type, ...props}: React.InputHTMLAttributes<HTMLInputElement>){
  return <input type={type} className={cn("flex h-10 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent disabled:opacity-50 text-white", className)} {...props} />
}
export function Label({className, ...props}: React.LabelHTMLAttributes<HTMLLabelElement>){
  return <label className={cn("text-sm font-medium leading-none text-zinc-300 peer-disabled:opacity-70", className)} {...props} />
}
export function Textarea({className, ...props}: React.TextareaHTMLAttributes<HTMLTextAreaElement>){
  return <textarea className={cn("flex min-h-[80px] w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 text-white", className)} {...props} />
}
export function Select({className, children, ...props}: React.SelectHTMLAttributes<HTMLSelectElement>){
  return <select className={cn("flex h-10 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 text-white", className)} {...props}>{children}</select>
}
