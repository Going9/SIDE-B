import * as React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "link";
  size?: "default" | "sm" | "lg";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className = "", variant = "default", size = "default", ...props },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

    const variants = {
      default:
        "bg-[#2563eb] text-white hover:bg-[#1d4ed8] rounded-full shadow-sm hover:shadow-md",
      outline:
        "border border-[#111111] bg-transparent text-[#111111] hover:bg-[#111111] hover:text-white rounded-full",
      ghost: "hover:bg-gray-100 text-[#111111] rounded-full",
      link: "text-[#2563eb] hover:text-[#1d4ed8] underline-offset-4 hover:underline p-0 h-auto",
    };

    const sizes = {
      default: "h-11 px-6 py-2 text-sm",
      sm: "h-9 px-4 text-sm",
      lg: "h-12 px-8 text-base",
    };

    return (
      <button
        className={`${baseStyles} ${variants[variant]} ${variant !== "link" ? sizes[size] : ""} ${className}`}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
