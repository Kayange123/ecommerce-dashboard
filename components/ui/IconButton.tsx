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
        "rounded-full flex items-center justify-center bg-white border shadow-md p-2 hover:scale-110 transition",
        className
      )}
    >
      {icon}
    </button>
  );
};

export default IconButton;
