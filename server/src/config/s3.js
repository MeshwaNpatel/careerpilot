import { S3Client } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  // S3_ENDPOINT/S3_FORCE_PATH_STYLE are only set in local dev to point at MinIO.
  ...(process.env.S3_ENDPOINT && { endpoint: process.env.S3_ENDPOINT }),
  ...(process.env.S3_FORCE_PATH_STYLE === 'true' && { forcePathStyle: true }),
});

export const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;

export default s3Client;
