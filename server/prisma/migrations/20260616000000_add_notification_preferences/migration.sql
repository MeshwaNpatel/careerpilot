-- AlterTable: add notification preference columns to users
ALTER TABLE "users" ADD COLUMN "email_notifications" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "users" ADD COLUMN "follow_up_reminders" BOOLEAN NOT NULL DEFAULT true;
