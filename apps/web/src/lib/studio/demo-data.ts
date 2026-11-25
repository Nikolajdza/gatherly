import {
  getTemplate,
  resolveTheme,
  type ExperienceDetail,
  type InviteRecord,
  type MemberRecord,
  type PublicItem,
  type SecretSantaView,
  type TaskRecord,
} from "@gatherly/shared";
import type { DemoTemplate } from "@/lib/template-media";

export const DEMO_USER_ID = "00000000-0000-4000-8000-000000000001";

export type DemoSantaParticipant = {
  id: string;
  userId: string;
  displayName: string;
  wishlist: Array<{ title: string; note: string; url: string | null }>;
};

export type DemoSanta = Omit<SecretSantaView, "myAssignment" | "viewerUserId" | "participants"> & {
  participants: DemoSantaParticipant[];
  assignments: Array<{ giverId: string; recipientId: string }>;
};

export type DemoState = {
  version: 2;
  experience: ExperienceDetail;
  members: MemberRecord[];
  invites: InviteRecord[];
  santa: DemoSanta | null;
  tasks: TaskRecord[];
};

let counter = 0;
export function demoId(prefix = "d") {
  counter += 1;
  const random = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${counter}`;
  return `${prefix}-${random}`;
}

function isoDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

type ItemSeed = Partial<PublicItem> & { title: string };

function items(seeds: ItemSeed[]): PublicItem[] {
  return seeds.map((seed, index) => ({
    id: `item-${index + 1}`,
    description: "",
    url: null,
    imageUrl: null,
    priceCents: null,
    currency: "EUR",
    category: null,
    priority: "medium",
    quantity: 1,
    itemKind: "product",
    isGroupGift: false,
    targetAmountCents: null,
    pledgedCents: 0,
    sortOrder: index,
    reserved: false,
    reservation: null,
    ...seed,
  }));
}

const taken = { reserved: true, reservation: { id: null, status: "active" as const, quantity: 1, mine: false } };

function members(names: Array<[string, MemberRecord["role"]]>): MemberRecord[] {
  return names.map(([displayName, role], index) => ({
    id: `member-${index}`,
    userId: index === 0 ? DEMO_USER_ID : `user-${index}`,
    role,
    displayName,
    email: index === 0 ? "you@example.com" : `${displayName.toLowerCase().split(" ")[0]}@example.com`,
    avatarUrl: null,
  }));
}

function base(template: DemoTemplate, data: Partial<ExperienceDetail> & { title: string }): ExperienceDetail {
  const definition = getTemplate(template);
  const now = new Date().toISOString();
  return {
    id: `demo-${template}`,
    ownerId: DEMO_USER_ID,
    type: definition?.type ?? "gift_registry",
    template,
    templateVersion: 1,
    slug: `demo-${template}`,
    description: "",
    status: "active",
    visibility: "unlisted",
    eventDate: null,
    timezone: "Europe/Belgrade",
    coverImageUrl: null,
    role: "owner",
    createdAt: now,
    updatedAt: now,
    config: {},
    themeConfig: resolveTheme(template),
    items: [],
    memberCount: 1,
    ...data,
  };
}

const futureInvite = (role: InviteRecord["role"], email: string | null): InviteRecord => ({
  id: demoId("invite"),
  role,
  email,
  status: "pending",
  expiresAt: new Date(Date.now() + 10 * 86_400_000).toISOString(),
  createdAt: new Date().toISOString(),
});

export function seedDemo(template: DemoTemplate): DemoState {
  switch (template) {
    case "baby-shower": {
      const people = members([["You", "owner"], ["Nikola Petrović", "editor"], ["Jelena M.", "participant"], ["Marija K.", "participant"], ["Stefan R.", "viewer"]]);
      return {
        version: 2,
        members: people,
        invites: [futureInvite("participant", "grandma@example.com")],
        santa: null,
        tasks: [],
        experience: base(template, {
          title: "Welcome, little Mila",
          description: "We are counting the days until our little girl arrives. Thank you for celebrating with us — every gift on this list was chosen with love.",
          eventDate: isoDays(42),
          memberCount: people.length,
          config: {
            version: 1,
            babyName: "Mila",
            motherName: "Ana",
            fatherName: "Nikola",
            expectedDate: isoDays(42),
            welcomeMessage: "We are counting the days until our little girl arrives. Thank you for celebrating with us — every gift on this list was chosen with love.",
            showCountdown: true,
            sections: [],
          },
          items: items([
            { title: "Urban stroller, sand", description: "Lightweight city stroller with a reversible seat and a big shopping basket.", imageUrl: "/images/products/stroller.jpg", priceCents: 45000, category: "Out & about", priority: "high", url: "https://shop.example/stroller", ...taken },
            { title: "Cloud & star mobile", description: "Hand-felted mobile in soft neutrals for the nursery.", imageUrl: "/images/products/mobile.jpg", priceCents: 3800, category: "Nursery", priority: "medium", url: "https://shop.example/mobile" },
            { title: "Knit blanket & bunny", description: "Organic cotton blanket with a matching knitted bunny.", imageUrl: "/images/products/blanket.jpg", priceCents: 6400, category: "Nursery", priority: "high", ...taken },
            { title: "Nappy subscription — 3 months", description: "Friends can chip in together for a practical gift that helps every single day.", priceCents: 15000, category: "Everyday", itemKind: "experience", isGroupGift: true, targetAmountCents: 15000, pledgedCents: 6500, priority: "medium" },
            { title: "First books bundle", description: "Ten board books for the first year — high-contrast pictures and gentle rhymes.", priceCents: 4200, category: "Play", priority: "low" },
            { title: "Baby bath set", description: "Soft hooded towels, a bath thermometer and natural wash.", priceCents: 5600, category: "Everyday", priority: "medium" },
          ]),
        }),
      };
    }
    case "wedding": {
      const people = members([["You", "owner"], ["Luka Jovanović", "editor"], ["Teodora", "participant"], ["Miloš", "participant"]]);
      return {
        version: 2,
        members: people,
        invites: [],
        santa: null,
        tasks: [],
        experience: base(template, {
          title: "Sofia & Luka",
          description: "Your presence is the greatest gift. If you would like to give something more, here are a few things for our new home and our honeymoon.",
          eventDate: isoDays(118),
          memberCount: people.length,
          config: {
            version: 1,
            partnerOneName: "Sofia",
            partnerTwoName: "Luka",
            weddingDate: isoDays(118),
            story: "We met on a rainy evening in Belgrade, sharing the last table in a tiny café. Seven years, two cities and one very patient dog later, we are getting married.",
            welcomeMessage: "Your presence is the greatest gift. If you would like to give something more, here are a few things for our new home and our honeymoon.",
            allowGroupGifts: true,
          },
          items: items([
            { title: "Espresso machine", description: "For slow Sunday mornings together.", imageUrl: "/images/products/espresso.jpg", priceCents: 52000, category: "Kitchen", priority: "high", isGroupGift: true, targetAmountCents: 52000, pledgedCents: 31000 },
            { title: "Linen bedding set", description: "Stonewashed linen in natural oat.", imageUrl: "/images/products/linen.jpg", priceCents: 18000, category: "Home", priority: "medium", ...taken },
            { title: "Leather weekender", description: "For every little trip we have planned.", imageUrl: "/images/products/weekender.jpg", priceCents: 24000, category: "Travel", priority: "medium" },
            { title: "Honeymoon dinner in Lisbon", description: "A dinner overlooking the Tagus on our first night.", priceCents: 16000, category: "Honeymoon", itemKind: "experience", isGroupGift: true, targetAmountCents: 16000, pledgedCents: 4000, priority: "high" },
            { title: "Hand-thrown dinner set", description: "Twelve pieces from a small ceramic studio.", priceCents: 21000, category: "Kitchen", priority: "low" },
          ]),
        }),
      };
    }
    case "birthday": {
      const people = members([["You", "owner"], ["Maja", "participant"], ["Đorđe", "participant"]]);
      return {
        version: 2,
        members: people,
        invites: [],
        santa: null,
        tasks: [],
        experience: base(template, {
          title: "Ana turns 30",
          description: "Thirty! Let's celebrate with good friends, good food and a few little wishes.",
          eventDate: isoDays(21),
          memberCount: people.length,
          config: { version: 1, celebrantName: "Ana", birthdayDate: isoDays(21), age: 30, welcomeMessage: "Thirty! Let's celebrate with good friends, good food and a few little wishes.", showBudget: true },
          items: items([
            { title: "Leather weekender", description: "For spontaneous weekends away.", imageUrl: "/images/products/weekender.jpg", priceCents: 24000, category: "Travel", priority: "high" },
            { title: "Pottery class for two", description: "An evening at the wheel with a friend.", priceCents: 7000, category: "Experiences", itemKind: "experience", priority: "medium", ...taken },
            { title: "Concert tickets", description: "Anything at the Kolarac hall this spring.", priceCents: 9000, category: "Experiences", itemKind: "experience", priority: "medium" },
            { title: "Linen bedding set", description: "In sage, please!", imageUrl: "/images/products/linen.jpg", priceCents: 18000, category: "Home", priority: "low" },
            { title: "Espresso machine", description: "Friends are chipping in together.", imageUrl: "/images/products/espresso.jpg", priceCents: 52000, category: "Home", isGroupGift: true, targetAmountCents: 52000, pledgedCents: 12000, priority: "high" },
          ]),
        }),
      };
    }
    case "secret-santa": {
      const names = ["You", "Marko", "Jelena", "Stefan", "Ivana", "Luka"];
      const people = members(names.map((name, index) => [name, index === 0 ? "owner" : "participant"]));
      const participants = people.map((person, index) => ({
        id: `p-${index}`,
        userId: person.userId,
        displayName: person.displayName,
        wishlist:
          index === 1
            ? [{ title: "A good detective novel", note: "Anything by Tana French", url: null }, { title: "Dark chocolate", note: "", url: null }]
            : index === 2
              ? [{ title: "Hand cream", note: "Unscented", url: null }]
              : [],
      }));
      return {
        version: 2,
        members: people,
        invites: [futureInvite("participant", null)],
        tasks: [],
        santa: {
          id: "santa-demo",
          status: "open",
          budgetCents: 3000,
          currency: "EUR",
          drawDate: isoDays(5),
          purchaseDeadline: isoDays(19),
          organizerParticipates: true,
          participants,
          exclusions: [{ id: "ex-1", participantAId: "p-1", participantBId: "p-2" }],
          assignments: [],
        },
        experience: base(template, {
          title: "Office Secret Santa",
          description: "Our yearly gift exchange! Keep it under €30, keep it secret and keep it fun.",
          eventDate: isoDays(24),
          memberCount: people.length,
          config: { version: 1, budgetCents: 3000, currency: "EUR", drawDate: isoDays(5), purchaseDeadline: isoDays(19), organizerParticipates: true, rules: "Handmade gifts are very welcome. No gift cards, please." },
        }),
      };
    }
    case "travel": {
      const people = members([["You", "owner"], ["Luka", "editor"]]);
      const task = (title: string, category: string, status: "open" | "done", priority: TaskRecord["priority"] = "medium", dueDate: string | null = null): TaskRecord => ({
        id: demoId("task"),
        parentId: null,
        title,
        notes: "",
        status,
        priority,
        category,
        dueDate,
        sortOrder: 0,
        labels: [],
        assigneeIds: [],
      });
      return {
        version: 2,
        members: people,
        invites: [],
        santa: null,
        tasks: [
          task("Passports", "Documents", "done", "high"),
          task("Travel insurance", "Documents", "open", "high", isoDays(6)),
          task("Ferry tickets to Herceg Novi", "Documents", "done", "medium"),
          task("Linen shirts", "Clothes", "done", "low"),
          task("Swimwear", "Clothes", "open", "medium"),
          task("Hiking sandals", "Clothes", "open", "low"),
          task("Sunscreen SPF 50", "Gear", "open", "high"),
          task("Snorkel set", "Gear", "done", "low"),
          task("Power bank", "Gear", "open", "medium"),
          task("Book a table in Perast", "Plans", "open", "medium", isoDays(10)),
        ].map((entry, index) => ({ ...entry, sortOrder: index })),
        experience: base(template, {
          title: "Summer in Montenegro",
          description: "Ten days by the sea — everything we need, ticked off together.",
          eventDate: isoDays(14),
          memberCount: people.length,
          config: { version: 1, listKind: "travel", notes: "Ten days by the sea — everything we need, ticked off together." },
        }),
      };
    }
  }
}

export const demoCatalog = [
  { title: "Leather weekender bag", imageUrl: "/images/products/weekender.jpg", priceCents: 24000, keywords: ["weekender", "bag", "travel"] },
  { title: "Espresso machine, brushed steel", imageUrl: "/images/products/espresso.jpg", priceCents: 52000, keywords: ["espresso", "coffee"] },
  { title: "Stonewashed linen bedding", imageUrl: "/images/products/linen.jpg", priceCents: 18000, keywords: ["linen", "bedding", "sheet"] },
  { title: "Knit baby blanket", imageUrl: "/images/products/blanket.jpg", priceCents: 6400, keywords: ["blanket", "knit"] },
  { title: "Felt cloud mobile", imageUrl: "/images/products/mobile.jpg", priceCents: 3800, keywords: ["mobile", "nursery"] },
  { title: "Urban stroller, sand", imageUrl: "/images/products/stroller.jpg", priceCents: 45000, keywords: ["stroller", "pram", "buggy"] },
];
