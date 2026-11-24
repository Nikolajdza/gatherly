import Link from "next/link";

export function Brand({ href, className = "" }: { href: string; className?: string }) {
  return (
    <Link className={`brand ${className}`} href={href}>
      <span className="brand-mark">G</span>
      Gatherly
    </Link>
  );
}
