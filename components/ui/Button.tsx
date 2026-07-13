import { ReactNode } from "react";

type ButtonProps = {
  children: ReactNode;
  variant?: "primary" | "secondary";
};

export default function Button({
  children,
  variant = "primary",
}: ButtonProps) {
  const base =
    "rounded-full px-8 py-4 font-semibold transition-all duration-300";

  const variants = {
    primary:
      "bg-blue-600 text-white hover:bg-blue-500 hover:scale-105 shadow-lg shadow-blue-600/30",

    secondary:
      "border border-white/10 bg-white/5 text-white backdrop-blur hover:bg-white hover:text-black",
  };

  return (
    <button className={`${base} ${variants[variant]}`}>
      {children}
    </button>
  );
}