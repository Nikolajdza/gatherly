export const templateImages: Record<string, string> = {
  "baby-shower": "/images/baby-shower.jpg",
  birthday: "/images/birthday.jpg",
  wedding: "/images/wedding.jpg",
  anniversary: "/images/anniversary.jpg",
  valentines: "/images/anniversary.jpg",
  christmas: "/images/secret-santa.jpg",
  housewarming: "/images/housewarming.jpg",
  graduation: "/images/hero.jpg",
  "secret-santa": "/images/secret-santa.jpg",
  "personal-todo": "/images/lists.jpg",
  "shared-todo": "/images/lists.jpg",
  shopping: "/images/lists.jpg",
  grocery: "/images/lists.jpg",
  travel: "/images/lists.jpg",
  "housewarming-planner": "/images/housewarming.jpg",
  party: "/images/birthday.jpg",
};

export const coverLibrary = [
  "/images/hero.jpg",
  "/images/baby-shower.jpg",
  "/images/wedding.jpg",
  "/images/birthday.jpg",
  "/images/anniversary.jpg",
  "/images/secret-santa.jpg",
  "/images/housewarming.jpg",
  "/images/lists.jpg",
  "/images/together.jpg",
  "/images/auth.jpg",
];

/** Prefer template-matched covers first in the design gallery. */
export function coversForTemplate(template: string) {
  const preferred = templateImages[template];
  if (!preferred) return coverLibrary;
  return [preferred, ...coverLibrary.filter((src) => src !== preferred)];
}

export const demoTemplates = ["baby-shower", "wedding", "birthday", "secret-santa", "travel"] as const;
export type DemoTemplate = (typeof demoTemplates)[number];

export function isDemoTemplate(value: string): value is DemoTemplate {
  return (demoTemplates as readonly string[]).includes(value);
}

export function coverFor(template: string, coverImageUrl?: string | null) {
  return coverImageUrl || templateImages[template] || "/images/hero.jpg";
}
