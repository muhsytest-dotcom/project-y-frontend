import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "muted" | "danger";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const variantClass =
    variant === "primary" ? "button-primary" : variant === "danger" ? "button-danger" : "button-muted";
  return <button className={`button ${variantClass} ${className}`.trim()} {...props} />;
}
