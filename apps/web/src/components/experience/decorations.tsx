import type { ThemeConfig } from "@gatherly/shared";

function Botanical({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 200 320" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" aria-hidden>
      <path d="M100 318C96 240 104 160 98 10" />
      {Array.from({ length: 9 }, (_, index) => {
        const y = 40 + index * 30;
        const side = index % 2 === 0 ? 1 : -1;
        return (
          <path
            key={y}
            d={`M${100 - side * 1} ${y + 18}C${100 + side * 30} ${y + 6} ${100 + side * 58} ${y + 10} ${100 + side * 70} ${y - 6}C${100 + side * 46} ${y - 12} ${100 + side * 20} ${y - 2} ${100 - side * 1} ${y + 18}Z`}
            fill={color}
            fillOpacity="0.12"
          />
        );
      })}
    </svg>
  );
}

function Confetti({ primary, accent }: { primary: string; accent: string }) {
  const colors = [primary, accent, "#e8b15a", "#7aa2a0"];
  return (
    <svg viewBox="0 0 260 260" aria-hidden>
      {Array.from({ length: 26 }, (_, index) => {
        const x = (index * 97) % 250;
        const y = (index * 53) % 250;
        const color = colors[index % colors.length];
        return index % 3 === 0 ? (
          <circle key={index} cx={x} cy={y} r={3 + (index % 3)} fill={color} opacity="0.7" />
        ) : (
          <rect key={index} x={x} y={y} width="10" height="4" rx="2" fill={color} opacity="0.75" transform={`rotate(${index * 37} ${x} ${y})`} />
        );
      })}
    </svg>
  );
}

function Rings({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 260 200" fill="none" stroke={color} strokeWidth="1.2" aria-hidden>
      <circle cx="100" cy="100" r="62" opacity="0.5" />
      <circle cx="160" cy="100" r="62" opacity="0.5" />
      <circle cx="100" cy="100" r="80" opacity="0.18" />
      <circle cx="160" cy="100" r="80" opacity="0.18" />
    </svg>
  );
}

function Snow({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 260 260" fill={color} aria-hidden>
      {Array.from({ length: 34 }, (_, index) => (
        <circle key={index} cx={(index * 71) % 255} cy={(index * 43) % 255} r={1.5 + (index % 4)} opacity={0.25 + (index % 3) * 0.15} />
      ))}
    </svg>
  );
}

export function Decorations({ theme }: { theme: ThemeConfig }) {
  if (theme.decorative === "none") return null;
  const art =
    theme.decorative === "botanical" ? <Botanical color={theme.primary} />
    : theme.decorative === "confetti" ? <Confetti primary={theme.primary} accent={theme.accent} />
    : theme.decorative === "rings" ? <Rings color={theme.accent} />
    : <Snow color={theme.accent} />;
  return (
    <>
      <div className="decor decor-tl">{art}</div>
      <div className="decor decor-br">{art}</div>
    </>
  );
}
