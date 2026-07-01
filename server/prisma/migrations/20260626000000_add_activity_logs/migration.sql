CREATE TABLE IF NOT EXISTS activity_logs (
  id             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  application_id TEXT NOT NULL,
  user_id        TEXT NOT NULL,
  type           VARCHAR(50) NOT NULL,
  metadata       JSONB NOT NULL DEFAULT '{}',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT activity_logs_pkey PRIMARY KEY (id),
  CONSTRAINT activity_logs_application_id_fkey FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
  CONSTRAINT activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_application_id ON activity_logs(application_id);
