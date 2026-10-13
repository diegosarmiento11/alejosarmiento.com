import Image from "next/image";
import { cn } from "cn";
import { author } from "@/lib/site";

// The portrait is 2:3 with the face in the upper third; anchor square crops there.
export function AuthorPhoto({
  size,
  className,
  priority = false,
}: {
  size: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={author.photo}
      alt={author.photoAlt}
      width={size}
      height={size}
      sizes={`${size}px`}
      priority={priority}
      className={cn("shrink-0 rounded-full object-cover object-[50%_20%]", className)}
      style={{ width: size, height: size }}
    />
  );
}
