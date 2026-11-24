# Arhitektura

Gatherly je modularni monolit podeljen na dve aplikacije, ne na mikroservise i ne na microfrontend.

## Granice

Next.js prikazuje interfejs, drži Supabase sesiju u kolačićima i zove NestJS. Poslovna pravila su u NestJS servisima. Next.js nema Server Actions za ta pravila. Jedini Route Handler je `/auth/callback`, jer tu Supabase zamenjuje kod za sesiju.

Ugovor između aplikacija su Zod šeme u `@gatherly/shared` i tipovi odgovora u istom paketu. `@gatherly/api-client` je tanak klijent nad tim tipovima. Swagger se generiše iz NestJS kontrolera na `/api/v1/docs` i u produkciji je isključen osim ako je `SWAGGER_ENABLED=true`.

## Podaci

`experiences` je zajednička instanca. Baby shower, rođendan i venčanje nisu posebne tabele. Razlikuju se po `template` i po `config`, koji se validira šemom te verzije šablona. Stavke, rezervacije, članovi, zadaci i dodele su relacione.

Jedna aktivna rezervacija po stavci je jedinstveni ključ na `active_item_id`. Kada se rezervacija otkaže, to polje postaje prazno i baza dozvoljava novu. Vlasnik liste u odgovoru ne dobija identitet osobe koja je rezervisala poklon.

Secret Santa dodele se čitaju samo upitom za davaoca koji je trenutni korisnik. Nema endpointa koji vraća celu mapu. Izvlačenje koristi `crypto.randomInt` i odbija nemoguća pravila isključenja.

## Autorizacija i RLS

Prisma se vezuje kao vlasnik tabela i zato ne primenjuje RLS politike krajnjeg korisnika. Svaki servis zato proverava članstvo i ulogu. `infrastructure/supabase/rls.sql` uključuje RLS i oduzima pristup rolama `anon` i `authenticated`, tako da Supabase Data API ne može da čita ove tabele. To nije zamena za provere u NestJS-u.

JWT se proverava preko Supabase JWKS (`ES256` / `RS256`) bibliotekom `jose`. Za stari HS256 token provera ide na Supabase Auth server. Identitet se uzima iz `sub`. ID iz tela zahteva se ne veruje.

## AI

Uvoz URL-a prvo proverava šemu, DNS i svako preusmerenje, pa odbija privatne i lokalne adrese. HTML se čita bez izvršavanja skripti, uz limit veličine i vremena. Cena, slika i URL ostaju oni koji su nađeni na stranici. Groq sme da očisti naslov i opis. Ako ključ nije podešen ili poziv padne, korisnik i dalje dobija ono što je pročitano sa stranice i može ručno da doda stavku.

## Deploy

- Vercel: root repozitorijuma, build komanda `pnpm --filter @gatherly/shared build && pnpm --filter @gatherly/api-client build && pnpm --filter @gatherly/web build`
- Render: `render.yaml`, health check `GET /api/v1/health`, proces sluša `0.0.0.0` i port iz okruženja
- Migracije: `pnpm --filter @gatherly/api prisma:migrate` (`prisma migrate deploy`)
