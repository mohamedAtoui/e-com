import Link from "next/link";

export function LightyLogo({ size = 25 }: { size?: number }) {
  return (
    <Link
      href="/"
      dir="ltr"
      className="flex items-baseline gap-[3px] font-serif font-semibold tracking-[-0.01em]"
      style={{ fontSize: size }}
    >
      <span>Light</span>
      <span className="relative inline-block">
        y
        <span
          className="absolute right-[-9px] top-[6px] h-[7px] w-[7px] rounded-full"
          style={{ background: "#F4B860", boxShadow: "0 0 12px 3px rgba(244,184,96,.85)" }}
        />
      </span>
    </Link>
  );
}
