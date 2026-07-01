CREATE TABLE IF NOT EXISTS "saved_jobs" (
  "id"          TEXT NOT NULL,
  "user_id"     TEXT NOT NULL,
  "external_id" TEXT NOT NULL,
  "title"       TEXT NOT NULL,
  "company"     TEXT NOT NULL,
  "location"    TEXT NOT NULL DEFAULT '',
  "url"         TEXT NOT NULL,
  "source"      TEXT NOT NULL,
  "salary_min"  INTEGER,
  "salary_max"  INTEGER,
  "salary"      TEXT,
  "description" TEXT,
  "job_type"    TEXT,
  "is_remote"   BOOLEAN NOT NULL DEFAULT false,
  "posted_at"   TIMESTAMP(3),
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "saved_jobs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "saved_jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "saved_jobs_user_id_external_id_key" ON "saved_jobs"("user_id", "external_id");
CREATE INDEX IF NOT EXISTS "idx_saved_jobs_user" ON "saved_jobs"("user_id");
