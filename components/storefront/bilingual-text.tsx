import { cn } from "@/lib/utils";

interface BilingualTextProps {
  fr: string;
  ar?: string | null;
  as?: "div" | "h1" | "h2" | "h3" | "span" | "p";
  className?: string;
  frClassName?: string;
  arClassName?: string;
  /** Hide the Arabic line (e.g. compact contexts). */
  frOnly?: boolean;
}

/**
 * Renders French (LTR) and Arabic (RTL) content together. French is primary;
 * Arabic is shown beneath with the Arabic font and dir="rtl".
 */
export function BilingualText({
  fr,
  ar,
  as: Tag = "div",
  className,
  frClassName,
  arClassName,
  frOnly,
}: BilingualTextProps) {
  return (
    <Tag className={className}>
      <span lang="fr" className={frClassName}>
        {fr}
      </span>
      {!frOnly && ar ? (
        <span
          lang="ar"
          dir="rtl"
          className={cn("block font-arabic text-muted-foreground", arClassName)}
        >
          {ar}
        </span>
      ) : null}
    </Tag>
  );
}
