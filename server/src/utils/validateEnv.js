const REQUIRED = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'SESSION_SECRET',
];

export function validateEnv() {
  const missing = REQUIRED.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error('\n[CareerPilot] Missing required environment variables:');
    missing.forEach((key) => console.error(`  ✗ ${key}`));
    console.error('\nAdd them to server/.env and restart the server.\n');
    process.exit(1);
  }
}
