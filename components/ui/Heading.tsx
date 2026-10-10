import { LucideIcon } from "lucide-react";

interface HeadingProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}

const Heading = ({ title, description, icon: Icon, action }: HeadingProps) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-x-3">
        {Icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        )}
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {action}
    </div>
  );
};

export default Heading;
