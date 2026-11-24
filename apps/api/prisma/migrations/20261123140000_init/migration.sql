-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "experience_type" AS ENUM ('gift_registry', 'secret_santa', 'task_list');

-- CreateEnum
CREATE TYPE "experience_status" AS ENUM ('draft', 'active', 'archived');

-- CreateEnum
CREATE TYPE "visibility" AS ENUM ('private', 'unlisted', 'public', 'invite_only');

-- CreateEnum
CREATE TYPE "member_role" AS ENUM ('owner', 'editor', 'participant', 'viewer');

-- CreateEnum
CREATE TYPE "invite_status" AS ENUM ('pending', 'accepted', 'revoked', 'expired');

-- CreateEnum
CREATE TYPE "reservation_status" AS ENUM ('active', 'cancelled');

-- CreateEnum
CREATE TYPE "item_kind" AS ENUM ('product', 'experience');

-- CreateEnum
CREATE TYPE "item_priority" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "draw_status" AS ENUM ('open', 'drawn', 'locked');

-- CreateEnum
CREATE TYPE "task_status" AS ENUM ('open', 'done');

-- CreateEnum
CREATE TYPE "task_priority" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "notification_type" AS ENUM ('invitation_accepted', 'draw_completed', 'reservation_created');

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "avatar_url" TEXT,
    "preferred_language" TEXT NOT NULL DEFAULT 'sr',
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Belgrade',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experiences" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "type" "experience_type" NOT NULL,
    "template" TEXT NOT NULL,
    "template_version" INTEGER NOT NULL DEFAULT 1,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "status" "experience_status" NOT NULL DEFAULT 'draft',
    "visibility" "visibility" NOT NULL DEFAULT 'unlisted',
    "event_date" DATE,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Belgrade',
    "cover_image_url" TEXT,
    "config" JSONB NOT NULL DEFAULT '{}',
    "theme_config" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "experiences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experience_members" (
    "id" UUID NOT NULL,
    "experience_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "member_role" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "experience_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experience_invites" (
    "id" UUID NOT NULL,
    "experience_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "role" "member_role" NOT NULL,
    "email" TEXT,
    "status" "invite_status" NOT NULL DEFAULT 'pending',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" UUID NOT NULL,
    "accepted_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "experience_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experience_items" (
    "id" UUID NOT NULL,
    "experience_id" UUID NOT NULL,
    "created_by_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "url" TEXT,
    "image_url" TEXT,
    "price_cents" INTEGER,
    "currency" TEXT,
    "category" TEXT,
    "priority" "item_priority" NOT NULL DEFAULT 'medium',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "item_kind" "item_kind" NOT NULL DEFAULT 'product',
    "is_group_gift" BOOLEAN NOT NULL DEFAULT false,
    "target_amount_cents" INTEGER,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "experience_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_reservations" (
    "id" UUID NOT NULL,
    "item_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "status" "reservation_status" NOT NULL DEFAULT 'active',
    "active_item_id" UUID,
    "note" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelled_at" TIMESTAMP(3),

    CONSTRAINT "item_reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gift_contributions" (
    "id" UUID NOT NULL,
    "item_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gift_contributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "secret_santa_draws" (
    "id" UUID NOT NULL,
    "experience_id" UUID NOT NULL,
    "budget_cents" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "draw_date" DATE,
    "purchase_deadline" DATE,
    "status" "draw_status" NOT NULL DEFAULT 'open',
    "organizer_participates" BOOLEAN NOT NULL DEFAULT true,
    "drawn_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "secret_santa_draws_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "secret_santa_participants" (
    "id" UUID NOT NULL,
    "draw_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "wishlist" JSONB NOT NULL DEFAULT '{"items":[]}',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "secret_santa_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "secret_santa_exclusions" (
    "id" UUID NOT NULL,
    "draw_id" UUID NOT NULL,
    "participant_low_id" UUID NOT NULL,
    "participant_high_id" UUID NOT NULL,

    CONSTRAINT "secret_santa_exclusions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "secret_santa_assignments" (
    "id" UUID NOT NULL,
    "draw_id" UUID NOT NULL,
    "giver_participant_id" UUID NOT NULL,
    "recipient_participant_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "secret_santa_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" UUID NOT NULL,
    "experience_id" UUID NOT NULL,
    "parent_id" UUID,
    "creator_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "status" "task_status" NOT NULL DEFAULT 'open',
    "priority" "task_priority" NOT NULL DEFAULT 'medium',
    "category" TEXT,
    "due_date" DATE,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_labels" (
    "id" UUID NOT NULL,
    "task_id" UUID NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "task_labels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_assignees" (
    "id" UUID NOT NULL,
    "task_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,

    CONSTRAINT "task_assignees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" UUID NOT NULL,
    "experience_id" UUID,
    "owner_id" UUID NOT NULL,
    "bucket" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_imports" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "experience_id" UUID,
    "source_url" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "extracted" JSONB NOT NULL,
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_imports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "experience_id" UUID,
    "type" "notification_type" NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_email_key" ON "profiles"("email");

-- CreateIndex
CREATE UNIQUE INDEX "experiences_slug_key" ON "experiences"("slug");

-- CreateIndex
CREATE INDEX "experiences_owner_id_idx" ON "experiences"("owner_id");

-- CreateIndex
CREATE INDEX "experiences_type_template_idx" ON "experiences"("type", "template");

-- CreateIndex
CREATE INDEX "experience_members_user_id_idx" ON "experience_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "experience_members_experience_id_user_id_key" ON "experience_members"("experience_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "experience_invites_token_hash_key" ON "experience_invites"("token_hash");

-- CreateIndex
CREATE INDEX "experience_invites_experience_id_status_idx" ON "experience_invites"("experience_id", "status");

-- CreateIndex
CREATE INDEX "experience_items_experience_id_sort_order_idx" ON "experience_items"("experience_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "item_reservations_active_item_id_key" ON "item_reservations"("active_item_id");

-- CreateIndex
CREATE INDEX "item_reservations_item_id_status_idx" ON "item_reservations"("item_id", "status");

-- CreateIndex
CREATE INDEX "item_reservations_user_id_idx" ON "item_reservations"("user_id");

-- CreateIndex
CREATE INDEX "gift_contributions_item_id_idx" ON "gift_contributions"("item_id");

-- CreateIndex
CREATE UNIQUE INDEX "secret_santa_draws_experience_id_key" ON "secret_santa_draws"("experience_id");

-- CreateIndex
CREATE UNIQUE INDEX "secret_santa_participants_draw_id_user_id_key" ON "secret_santa_participants"("draw_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "secret_santa_exclusions_draw_id_participant_low_id_particip_key" ON "secret_santa_exclusions"("draw_id", "participant_low_id", "participant_high_id");

-- CreateIndex
CREATE UNIQUE INDEX "secret_santa_assignments_giver_participant_id_key" ON "secret_santa_assignments"("giver_participant_id");

-- CreateIndex
CREATE UNIQUE INDEX "secret_santa_assignments_recipient_participant_id_key" ON "secret_santa_assignments"("recipient_participant_id");

-- CreateIndex
CREATE INDEX "tasks_experience_id_status_idx" ON "tasks"("experience_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "task_labels_task_id_label_key" ON "task_labels"("task_id", "label");

-- CreateIndex
CREATE UNIQUE INDEX "task_assignees_task_id_user_id_key" ON "task_assignees"("task_id", "user_id");

-- CreateIndex
CREATE INDEX "attachments_experience_id_idx" ON "attachments"("experience_id");

-- CreateIndex
CREATE INDEX "ai_imports_user_id_idx" ON "ai_imports"("user_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_read_at_idx" ON "notifications"("user_id", "read_at");

-- AddForeignKey
ALTER TABLE "experiences" ADD CONSTRAINT "experiences_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experience_members" ADD CONSTRAINT "experience_members_experience_id_fkey" FOREIGN KEY ("experience_id") REFERENCES "experiences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experience_members" ADD CONSTRAINT "experience_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experience_invites" ADD CONSTRAINT "experience_invites_experience_id_fkey" FOREIGN KEY ("experience_id") REFERENCES "experiences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experience_invites" ADD CONSTRAINT "experience_invites_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experience_invites" ADD CONSTRAINT "experience_invites_accepted_by_id_fkey" FOREIGN KEY ("accepted_by_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experience_items" ADD CONSTRAINT "experience_items_experience_id_fkey" FOREIGN KEY ("experience_id") REFERENCES "experiences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experience_items" ADD CONSTRAINT "experience_items_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_reservations" ADD CONSTRAINT "item_reservations_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "experience_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_reservations" ADD CONSTRAINT "item_reservations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gift_contributions" ADD CONSTRAINT "gift_contributions_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "experience_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gift_contributions" ADD CONSTRAINT "gift_contributions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secret_santa_draws" ADD CONSTRAINT "secret_santa_draws_experience_id_fkey" FOREIGN KEY ("experience_id") REFERENCES "experiences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secret_santa_participants" ADD CONSTRAINT "secret_santa_participants_draw_id_fkey" FOREIGN KEY ("draw_id") REFERENCES "secret_santa_draws"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secret_santa_participants" ADD CONSTRAINT "secret_santa_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secret_santa_exclusions" ADD CONSTRAINT "secret_santa_exclusions_draw_id_fkey" FOREIGN KEY ("draw_id") REFERENCES "secret_santa_draws"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secret_santa_exclusions" ADD CONSTRAINT "secret_santa_exclusions_participant_low_id_fkey" FOREIGN KEY ("participant_low_id") REFERENCES "secret_santa_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secret_santa_exclusions" ADD CONSTRAINT "secret_santa_exclusions_participant_high_id_fkey" FOREIGN KEY ("participant_high_id") REFERENCES "secret_santa_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secret_santa_assignments" ADD CONSTRAINT "secret_santa_assignments_draw_id_fkey" FOREIGN KEY ("draw_id") REFERENCES "secret_santa_draws"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secret_santa_assignments" ADD CONSTRAINT "secret_santa_assignments_giver_participant_id_fkey" FOREIGN KEY ("giver_participant_id") REFERENCES "secret_santa_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secret_santa_assignments" ADD CONSTRAINT "secret_santa_assignments_recipient_participant_id_fkey" FOREIGN KEY ("recipient_participant_id") REFERENCES "secret_santa_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_experience_id_fkey" FOREIGN KEY ("experience_id") REFERENCES "experiences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_labels" ADD CONSTRAINT "task_labels_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_assignees" ADD CONSTRAINT "task_assignees_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_assignees" ADD CONSTRAINT "task_assignees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_experience_id_fkey" FOREIGN KEY ("experience_id") REFERENCES "experiences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_imports" ADD CONSTRAINT "ai_imports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_imports" ADD CONSTRAINT "ai_imports_experience_id_fkey" FOREIGN KEY ("experience_id") REFERENCES "experiences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_experience_id_fkey" FOREIGN KEY ("experience_id") REFERENCES "experiences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

