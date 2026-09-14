import { cn } from "@/lib/utils";
import { MouseEventHandler, ReactElement } from "react";

interface IconButtonProps {
  onClick?: MouseEventHandler<HTMLButtonElement> | undefined;
  className?: string;
  icon: ReactElement;
}
const IconButton = ({ onClick, className, icon }: IconButtonProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-center rounded-full border bg-white p-2 shadow-md transition hover:scale-110",
        className
      )}
    >
      {icon}
    </button>
  );
};

export default IconButton;
