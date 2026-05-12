import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials, generateAvatarColor, cn } from "@/lib/utils";

interface UserAvatarProps {
  name: string;
  imageUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-7 w-7 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-12 w-12 text-base",
};

export function UserAvatar({
  name,
  imageUrl,
  size = "md",
  className,
}: UserAvatarProps) {
  const colorClass = generateAvatarColor(name);
  const initials = getInitials(name);

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      {imageUrl && <AvatarImage src={imageUrl} alt={name} />}
      <AvatarFallback
        className={cn("text-white font-semibold", colorClass)}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
