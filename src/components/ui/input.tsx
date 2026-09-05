import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

const fieldBase =
  "w-full rounded-xl border bg-ink-900/70 px-4 text-[15px] text-white placeholder:text-white/35 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500/60 focus:border-brand-500/60 disabled:opacity-60";

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        fieldBase,
        "h-12",
        invalid ? "border-rose-500/60 focus:ring-rose-500/50" : "border-white/12",
        className
      )}
      {...props}
    />
  );
});

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }
>(function Textarea({ className, invalid, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        fieldBase,
        "min-h-28 resize-y py-3 leading-relaxed",
        invalid ? "border-rose-500/60 focus:ring-rose-500/50" : "border-white/12",
        className
      )}
      {...props}
    />
  );
});

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(
        fieldBase,
        "h-12 cursor-pointer appearance-none border-white/12 bg-[length:16px] bg-[right_1rem_center] bg-no-repeat pr-10",
        className
      )}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
      }}
      {...props}
    >
      {children}
    </select>
  );
});

export function Label({
  className,
  children,
  required,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
  return (
    <label
      className={cn("mb-2 block text-[13px] font-medium text-white/70", className)}
      {...props}
    >
      {children}
      {required && <span className="ml-0.5 text-rose-400">*</span>}
    </label>
  );
}

export function FieldError({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="mt-1.5 text-[13px] text-rose-400">
      {children}
    </p>
  );
}

export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor} required={required}>
        {label}
      </Label>
      {children}
      {hint && !error && <p className="mt-1.5 text-[12px] text-white/40">{hint}</p>}
      <FieldError>{error}</FieldError>
    </div>
  );
}

export function Checkbox({
  className,
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const generatedId = React.useId();
  const id = props.id ?? generatedId;
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer select-none items-center gap-2.5 text-sm text-white/75"
    >
      <input
        id={id}
        type="checkbox"
        className={cn(
          "h-4.5 w-4.5 cursor-pointer rounded border border-white/20 bg-ink-900 accent-brand-500",
          className
        )}
        {...props}
      />
      {label}
    </label>
  );
}
