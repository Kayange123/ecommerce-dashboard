"use client";
import { Copy, Server } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./alert";
import { Badge, BadgeProps } from "./badge";
import { Button } from "./button";
import { toast } from "react-hot-toast";

interface ApiAlertProps {
  title: string;
  description: string;
  variant: "public" | "admin";
}

const textMap: Record<ApiAlertProps["variant"], string> = {
  public: "Public",
  admin: "Admin",
};
const variantMap: Record<ApiAlertProps["variant"], BadgeProps["variant"]> = {
  public: "secondary",
  admin: "destructive",
};

const ApiAlert = ({
  title,
  description,
  variant = "public",
}: ApiAlertProps) => {
  const onCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("API copied to clipboard");
  };
  return (
    <Alert className="flex flex-col">
      <div className="flex space-x-3 flex-row">
        <Server className="w-4 h-4" />
        <AlertTitle className="flex items-center gap-x-2">
          {title}
          <Badge variant={variantMap[variant]}>{textMap[variant]}</Badge>
        </AlertTitle>
      </div>
      <div>
        <AlertDescription className="mt-4 flex items-center justify-between">
          <code className="relative rounde bg-muted px-[0.3rem] py-[0.2rem] overflow-ellipsis font-mono font-semibold text-sm md:text-base">
            {description}
          </code>
          <Button
            variant="outline"
            onClick={() => onCopy(description)}
            size="sm"
          >
            <Copy className="w-4 h-4" />
          </Button>
        </AlertDescription>
      </div>
    </Alert>
  );
};

export default ApiAlert;
