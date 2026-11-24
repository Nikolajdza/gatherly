# Gatherly

Gatherly je platforma na kojoj jedan nalog može da ima više nezavisnih iskustava: liste poklona, Secret Santa i liste zadataka. Svako iskustvo ima svoj šablon, temu, članove i pravila.

Repozitorijum je monorepo sa dve aplikacije:

- `apps/web` — Next.js, ide na Vercel
- `apps/api` — NestJS, ide na Render
- Supabase drži PostgreSQL, autentifikaciju i skladište fajlova
- Prisma je ORM
- Groq se koristi samo za opcione AI pozive

## Demo bez backenda

Demo radi bez Supabase-a i API-ja. Podaci su primeri i čuvaju se samo u trenutnoj kartici pregledača (`sessionStorage`).

- [http://localhost:3000/en/demo](http://localhost:3000/en/demo) — spisak demo stranica
- `/en/demo/<šablon>` — javna stranica za goste
- `/en/demo/<šablon>/admin` — admin panel tog iskustva

Šabloni: `baby-shower`, `wedding`, `birthday`, `secret-santa`, `travel`. Ako nešto rezervišeš kao gost, odmah se vidi u admin panelu, i obrnuto. Secret Santa koristi isti algoritam izvlačenja kao API. Uvoz linka u demou vraća označen primer proizvoda i ne čita pravu prodavnicu.

## Jezici

Engleski je podrazumevan. Podržani su još srpski, ruski, italijanski, nemački, španski i francuski. Jezik se bira preko ikonice globusa. Izbor se pamti u kolačiću `NEXT_LOCALE`, a bez njega se koristi jezik pregledača. Prevodi su u `apps/web/src/i18n/dictionaries`. `en.ts` je izvor, a kod ostalih jezika ključ koji fali pada na engleski.

## Lokalno pokretanje

Potrebni su Node.js 22+ i pnpm 11.

```bash
docker compose up -d
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

U `apps/api/.env` za lokalni Postgres stavi:

```bash
DATABASE_URL=postgresql://gatherly:gatherly@localhost:5432/gatherly
```

Zatim:

```bash
pnpm install
pnpm --filter @gatherly/api prisma:migrate
pnpm --filter @gatherly/shared build
pnpm dev
```

Web je na [http://localhost:3000](http://localhost:3000), API na [http://localhost:4000/api/v1/health](http://localhost:4000/api/v1/health), Swagger u razvoju na [http://localhost:4000/api/v1/docs](http://localhost:4000/api/v1/docs).

Nalozi rade tek kada u oba env fajla uneseš Supabase projekat. Asimetrični JWT ključevi su podrazumevani. Ako projekat još koristi stari HS256, API proverava token preko Supabase Auth servera i ne traži JWT tajnu.

Za bazu na Renderu koristi Supabase Shared Pooler, session mode, port 5432. Direktna IPv6 konekcija sa Rendera ne treba da se pretpostavlja.

Posle migracija, na Supabase pokreni `infrastructure/supabase/rls.sql` i `infrastructure/supabase/storage.sql`.

## Testovi

```bash
pnpm test
```

## Šta ova verzija radi

- registracija, prijava i oporavak lozinke preko Supabase Auth
- više iskustava po nalogu, sa ulogama owner, editor, participant i viewer
- šabloni za poklone, Secret Santa i liste
- javna stranica, pozivnice sa heširanim tokenom, rezervacije i obećani doprinosi
- Secret Santa izvlačenje koje API ne vraća organizatoru
- uvoz proizvoda sa javnog URL-a; cena ostaje prazna ako nije na stranici
- ručni unos radi i kada Groq nije podešen
- admin panel po iskustvu: pregled, pokloni, rezervacije (bez imena), Secret Santa, zadaci, ljudi i pozivnice, dizajn sa živim pregledom, deljenje sa QR kodom, podešavanja i brisanje

## AI pomoćnik

Sve AI funkcije idu preko API-ja (`/api/v1/ai/*`). `GROQ_API_KEY` postoji samo na serveru. Svaki predlog korisnik prvo vidi i potvrdi, ništa se ne upisuje samo.

- **Pokloni:** kartica iz linka (naziv, opis, kategorija, prioritet), uvoz iz nalepljenog teksta stranice kada sajt blokira čitanje, ideje za poklone prema događaju i postojećoj listi
- **Rezervacije:** poruke zahvalnosti po rezervisanom poklonu, bez imena gostiju
- **Secret Santa:** ideje za poklon samo za tvoj par (šalje se budžet i želje primaoca, bez imena) i poruka-pozivnica
- **Deljenje:** kratka poruka uz link, koju koriste dugmad za WhatsApp, Viber, Telegram i email
- **Zadaci:** lista zadataka iz jedne rečenice (rokovi ne prelaze datum događaja) i sređivanje liste: kategorije za zadatke bez nje i uklanjanje duplikata
- **Podešavanja:** opis događaja u izabranom tonu i jeziku

Cena se nikad ne izmišlja: prihvata se samo ako se isti iznos i valuta nalaze u tekstu stranice. Dnevni limit po korisniku je `AI_DAILY_LIMIT` (podrazumevano 60 poziva u 24 sata, tabela `ai_usage`). Bez Groq ključa AI dugmad vraćaju jasnu poruku, a ručni unos radi normalno. U demo režimu AI daje unapred pripremljene primere, označene kao primeri.

Posle ažuriranja ponovo pokreni `prisma:migrate` (migracija `ai_usage`) i `infrastructure/supabase/rls.sql`.
