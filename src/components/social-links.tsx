import { ArrowUpRightIcon, MailIcon } from "lucide-react";
import { cn } from "cn";
import { InstagramIcon, LinkedInIcon } from "@/components/icons";
import { author, socials } from "@/lib/site";

const itemClass =
  "inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-foreground/40";

export function SocialLinks({
  className,
  withEmail = false,
}: {
  className?: string;
  withEmail?: boolean;
}) {
  return (
    <ul className={cn("flex flex-wrap gap-2", className)}>
      <li>
        <a href={socials.instagram.url} target="_blank" rel="me noopener" className={itemClass}>
          <InstagramIcon className="size-4" />
          Instagram
        </a>
      </li>
      <li>
        <a href={socials.linkedin.url} target="_blank" rel="me noopener" className={itemClass}>
          <LinkedInIcon className="size-4" />
          LinkedIn
        </a>
      </li>
      <li>
        <a href={socials.forabi.url} target="_blank" rel="me noopener" className={itemClass}>
          forabi.ai
          <ArrowUpRightIcon className="size-3.5 text-muted-foreground" />
        </a>
      </li>
      {withEmail ? (
        <li>
          <a href={`mailto:${author.email}`} className={itemClass}>
            <MailIcon className="size-4" />
            {author.email}
          </a>
        </li>
      ) : null}
    </ul>
  );
}
