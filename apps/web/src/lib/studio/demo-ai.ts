import {
  type AiTone,
  type ChecklistSuggestion,
  type ExperienceDetail,
  type GiftIdea,
  type ProductPreview,
  type SantaGiftIdea,
  type TaskRecord,
  type TaskTidyResult,
  type ThankYouNote,
  cleanCategory,
  detectCurrency,
  dueDateFrom,
  parsePriceToCents,
} from "@gatherly/shared";
import type { DemoTemplate } from "@/lib/template-media";
import { demoId } from "./demo-data";

// Sample answers for the demo. They are deterministic and labelled in the UI; the real
// answers come from the API, which keeps the model key on the server.

const ideaBank: Record<"baby-shower" | "wedding" | "birthday", Array<Omit<GiftIdea, "category"> & { category: string }>> = {
  "baby-shower": [
    { title: "Soft baby carrier wrap", description: "Keeps the baby close and both hands free during the first months.", category: "Out & about", itemKind: "product" },
    { title: "White noise machine", description: "Gentle sounds that help the whole family sleep a little longer.", category: "Nursery", itemKind: "product" },
    { title: "Nursing pillow", description: "Makes feeding more comfortable for mum and baby.", category: "Everyday", itemKind: "product" },
    { title: "Video baby monitor", description: "Peace of mind when the baby naps in another room.", category: "Nursery", itemKind: "product" },
    { title: "First-year photo album", description: "A place for every first smile, step and birthday.", category: "Play", itemKind: "product" },
    { title: "Muslin swaddle set", description: "Breathable, soft and useful for almost everything.", category: "Everyday", itemKind: "product" },
    { title: "Wooden play gym", description: "Simple, calm toys to reach for and explore.", category: "Play", itemKind: "product" },
    { title: "Newborn photo session", description: "Professional photos of the first weeks, a memory for life.", category: "Experiences", itemKind: "experience" },
  ],
  wedding: [
    { title: "Tasting menu for two", description: "An evening out to celebrate the first months of marriage.", category: "Experiences", itemKind: "experience" },
    { title: "Cast-iron cookware set", description: "Built to last for decades of shared dinners.", category: "Kitchen", itemKind: "product" },
    { title: "Wine country weekend", description: "Two quiet days among vineyards, just for the two of you.", category: "Honeymoon", itemKind: "experience" },
    { title: "Monogrammed bath towels", description: "Everyday luxury with a personal touch.", category: "Home", itemKind: "product" },
    { title: "Framed wedding print", description: "Your favourite photo from the day, beautifully framed.", category: "Home", itemKind: "product" },
    { title: "Cocktail set", description: "For hosting friends in your new home.", category: "Kitchen", itemKind: "product" },
    { title: "Pottery class for two", description: "Make your own plates together and use them every day.", category: "Experiences", itemKind: "experience" },
    { title: "Indoor olive tree", description: "A living gift that grows with your home.", category: "Home", itemKind: "product" },
  ],
  birthday: [
    { title: "Concert tickets", description: "A night out with the music she loves.", category: "Experiences", itemKind: "experience" },
    { title: "Wireless headphones", description: "Great sound for commutes, workouts and long trips.", category: "Tech", itemKind: "product" },
    { title: "Cooking class", description: "Learn a new cuisine and bring the recipes home.", category: "Experiences", itemKind: "experience" },
    { title: "Leather notebook", description: "For plans, ideas and the next thirty years.", category: "Everyday", itemKind: "product" },
    { title: "Instant camera", description: "Prints the moment right away, perfect for the party.", category: "Tech", itemKind: "product" },
    { title: "Spa day", description: "A full day of rest after a busy year.", category: "Experiences", itemKind: "experience" },
    { title: "Board game night set", description: "Two great games for evenings with friends.", category: "Fun", itemKind: "product" },
    { title: "Scented candle trio", description: "Small luxury that makes any room feel calm.", category: "Home", itemKind: "product" },
  ],
};

export function demoGiftIdeas(template: DemoTemplate, experience: ExperienceDetail, prompt: string): GiftIdea[] {
  const bank = template === "wedding" || template === "birthday" ? ideaBank[template] : ideaBank["baby-shower"];
  const known = [...new Set(experience.items.map((item) => item.category).filter((value): value is string => Boolean(value)))];
  const existing = new Set(experience.items.map((item) => item.title.toLowerCase()));
  const words = prompt.toLowerCase().split(/\W+/).filter((word) => word.length > 3);
  const score = (idea: GiftIdea) => words.filter((word) => `${idea.title} ${idea.description} ${idea.category}`.toLowerCase().includes(word)).length;
  return bank
    .filter((idea) => !existing.has(idea.title.toLowerCase()))
    .map((idea) => ({ ...idea, category: cleanCategory(idea.category, known) }))
    .sort((a, b) => score(b) - score(a));
}

export function demoProductFromText(text: string, url: string | null): ProductPreview {
  const lines = text.split("\n").map((line) => line.trim());
  const firstLine = lines.find((line) => line.length > 3 && line.length < 90 && !/[|>›»]/.test(line) && /\s/.test(line) && !/\d[\d.,]*\s*(?:€|eur|rsd|din|\$|£|₽)/i.test(line));
  const description = lines.find((line) => line !== firstLine && line.length >= 25 && line.length < 240 && !/[|>›»]/.test(line));
  const priced = text.match(/(?:€|eur|rsd|din\.?|\$|£|₽)\s*(\d[\d.,]*)|(\d[\d.,]*)\s*(?:€|eur\b|rsd\b|din\b|дин|\$|£|₽|руб)/i);
  const priceCents = priced ? parsePriceToCents(priced[1] ?? priced[2]) : null;
  const currency = priceCents === null ? null : detectCurrency(priced?.[0] ?? "");
  return {
    importId: demoId("import"),
    title: firstLine ?? "Gift from the shop page",
    description: description ?? "",
    imageUrl: null,
    priceCents: currency ? priceCents : null,
    currency,
    url,
    category: null,
    priority: "medium",
    aiUsed: true,
    priceFoundOnPage: Boolean(currency && priceCents !== null),
    imageFoundOnPage: false,
  };
}

const thanks: Record<AiTone, (title: string) => string> = {
  warm: (title) => `Thank you so much for the ${title.toLowerCase()} — it means a lot to us and we already know how often we will use it.`,
  formal: (title) => `Please accept our sincere thanks for the ${title.toLowerCase()}. Your thoughtfulness is truly appreciated.`,
  playful: (title) => `The ${title.toLowerCase()} has officially made us very happy people. Thank you for being so wonderful!`,
};

export function demoThankYouNotes(experience: ExperienceDetail, tone: AiTone): ThankYouNote[] {
  return experience.items
    .filter((item) => item.reserved || item.pledgedCents > 0)
    .map((item) => ({
      itemId: item.id,
      title: item.title,
      message: item.isGroupGift
        ? `To everyone who chipped in for the ${item.title.toLowerCase()}: thank you for coming together for us.`
        : thanks[tone](item.title),
    }));
}

export function demoSantaIdeas(wishlist: Array<{ title: string }>, budget: string | null): SantaGiftIdea[] {
  const fromWishes = wishlist.slice(0, 3).map((wish) => ({
    title: wish.title,
    note: `Straight from their wishlist${budget ? `, try to keep it within ${budget}` : ""}.`,
  }));
  return [
    ...fromWishes,
    { title: "Cosy reading set", note: "A paperback, a soft blanket and good tea." },
    { title: "Specialty coffee sampler", note: "Three small-batch roasts to try at home." },
    { title: "Desk plant in a ceramic pot", note: "Low maintenance and brightens any desk." },
    { title: "Personalised mug", note: "Something they will use every single morning." },
  ].slice(0, 6);
}

export function demoMessage(purpose: "share" | "santa_invite", tone: AiTone, experience: ExperienceDetail): string {
  if (purpose === "santa_invite") {
    return tone === "formal"
      ? `You are invited to "${experience.title}". Join through the link, add a short wishlist and wait for the draw. Everyone will see only the person they are giving to.`
      : `🎁 Secret Santa time! Join "${experience.title}" with the link, add a few wishes, and after the draw you will see who you are buying for — and nobody else will.`;
  }
  if (tone === "formal") return `We would be delighted if you visited our page for "${experience.title}". You will find all the details and the gift list there.`;
  if (tone === "playful") return `Psst! Everything about "${experience.title}" is on one pretty page — gifts, dates and all. Take a peek! ✨`;
  return `We made a little page for "${experience.title}" — all the details and our wishlist are there. It would mean a lot if you took a look.`;
}

const checklists: Array<{ match: RegExp; tasks: Array<[string, string, ChecklistSuggestion["priority"], number | null]> }> = [
  {
    match: /trip|travel|beach|holiday|vacation|journey|put|more|reise|viaggio|viaje|voyage/i,
    tasks: [
      ["Check passports and ID cards", "Documents", "high", 2],
      ["Book airport transfer", "Plans", "medium", 5],
      ["Buy travel insurance", "Documents", "high", 3],
      ["Pack sunscreen and after-sun", "Toiletries", "medium", 10],
      ["Download offline maps", "Plans", "low", 12],
      ["Pack swimwear and beach towels", "Clothes", "medium", 11],
      ["Charge power banks", "Gear", "low", 13],
      ["Print booking confirmations", "Documents", "medium", 12],
      ["Ask a neighbour to water the plants", "Home", "low", 9],
      ["Exchange some cash", "Money", "medium", 8],
    ],
  },
  {
    match: /party|birthday|celebrat|žurk|rođend|fest|festa|fiesta|fête/i,
    tasks: [
      ["Send invitations", "Guests", "high", 1],
      ["Order the cake", "Food", "high", 7],
      ["Plan the playlist", "Music", "low", 10],
      ["Buy decorations and candles", "Decor", "medium", 8],
      ["Confirm the guest list", "Guests", "medium", 6],
      ["Prepare snacks and drinks", "Food", "medium", 12],
      ["Set up a photo corner", "Decor", "low", 13],
      ["Clean up plan for the next day", "Home", "low", null],
    ],
  },
  {
    match: /move|moving|selid|umzug|trasloc|mudanza|déménag/i,
    tasks: [
      ["Book the moving van", "Logistics", "high", 3],
      ["Collect boxes and tape", "Packing", "medium", 5],
      ["Change address at the bank", "Admin", "medium", 14],
      ["Transfer internet and utilities", "Admin", "high", 10],
      ["Pack room by room", "Packing", "medium", 15],
      ["Clean the old flat", "Home", "medium", 20],
      ["Label boxes by room", "Packing", "low", 15],
    ],
  },
];

export function demoChecklist(prompt: string, existing: TaskRecord[], eventDate: string | null): ChecklistSuggestion[] {
  const list = checklists.find((entry) => entry.match.test(prompt))?.tasks ?? [
    ["Write down the goal and the deadline", "Plan", "high", 1],
    ["Split the work into small steps", "Plan", "medium", 2],
    ["Decide who does what", "People", "medium", 3],
    ["Set a budget", "Money", "medium", 4],
    ["Check progress halfway", "Plan", "low", 10],
  ] as Array<[string, string, ChecklistSuggestion["priority"], number | null]>;
  const known = [...new Set(existing.map((task) => task.category).filter((value): value is string => Boolean(value)))];
  const titles = new Set(existing.map((task) => task.title.toLowerCase()));
  const event = eventDate ? new Date(`${eventDate}T00:00:00Z`) : null;
  return list
    .filter(([title]) => !titles.has(title.toLowerCase()))
    .map(([title, category, priority, days]) => ({
      title,
      category: cleanCategory(category, known),
      priority,
      dueDate: dueDateFrom(days, new Date(), event),
    }));
}

const tidyWords: Array<[RegExp, string]> = [
  [/passport|ticket|insurance|visa|id card|booking|document/i, "Documents"],
  [/shirt|dress|shoe|sock|jacket|swim|cloth/i, "Clothes"],
  [/charger|power|camera|adapter|headphone|cable|gear/i, "Gear"],
  [/sunscreen|toothbrush|shampoo|cream|toilet/i, "Toiletries"],
  [/buy|shop|order|milk|bread|fruit|food|snack/i, "Shopping"],
  [/call|email|book|reserve|plan|schedule/i, "Plans"],
];

export function demoTidy(tasks: TaskRecord[]): TaskTidyResult {
  const known = [...new Set(tasks.map((task) => task.category).filter((value): value is string => Boolean(value)))];
  const groups = new Map<string, TaskRecord[]>();
  for (const task of tasks) {
    const key = task.title.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
    groups.set(key, [...(groups.get(key) ?? []), task]);
  }
  const duplicateIds = new Set<string>();
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    const keep = group.find((task) => task.status === "open") ?? group[0]!;
    for (const task of group) if (task.id !== keep.id) duplicateIds.add(task.id);
  }
  const categories = tasks
    .filter((task) => !task.category && !duplicateIds.has(task.id))
    .map((task) => ({ taskId: task.id, category: cleanCategory(tidyWords.find(([pattern]) => pattern.test(task.title))?.[1] ?? "Other", known)! }));
  return { categories, duplicateIds: [...duplicateIds] };
}
