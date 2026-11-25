-- Plan tier for monetization gates
DO $$ BEGIN
  CREATE TYPE "plan_tier" AS ENUM ('free', 'pro');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "profiles"
  ADD COLUMN IF NOT EXISTS "plan" "plan_tier" NOT NULL DEFAULT 'free';

-- Thank-you mode: host may reveal who reserved gifts
ALTER TABLE "experiences"
  ADD COLUMN IF NOT EXISTS "thank_you_mode" BOOLEAN NOT NULL DEFAULT false;

-- Reminder dedupe for purchase deadlines
ALTER TABLE "secret_santa_draws"
  ADD COLUMN IF NOT EXISTS "deadline_reminder_sent_at" TIMESTAMPTZ;
