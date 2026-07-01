import { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import s3Client, { S3_BUCKET_NAME } from '../config/s3.js';

const PRESIGNED_URL_EXPIRY_SECONDS = 60 * 60; // 1 hour

export function buildResumeKey(userId, originalFilename) {
  const sanitized = originalFilename.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `resumes/${userId}/${Date.now()}-${sanitized}`;
}

/**
 * Non-signed reference URL stored on the resume record. The bucket is
 * private, so this is informational only — actual downloads always go
 * through getPresignedDownloadUrl().
 */
export function buildObjectUrl(key) {
  if (process.env.S3_ENDPOINT) {
    return `${process.env.S3_ENDPOINT}/${S3_BUCKET_NAME}/${key}`;
  }
  return `https://${S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}

export async function uploadBufferToS3({ key, buffer, contentType }) {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  return key;
}

export async function deleteFromS3(key) {
  await s3Client.send(new DeleteObjectCommand({ Bucket: S3_BUCKET_NAME, Key: key }));
}

export async function getS3ObjectBuffer(key) {
  const response = await s3Client.send(new GetObjectCommand({ Bucket: S3_BUCKET_NAME, Key: key }));
  const chunks = [];
  for await (const chunk of response.Body) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

/**
 * The bucket is private — resume files are only ever accessed via
 * short-lived pre-signed URLs (1-hour expiry).
 */
export async function getPresignedDownloadUrl(key) {
  const command = new GetObjectCommand({ Bucket: S3_BUCKET_NAME, Key: key });
  return getSignedUrl(s3Client, command, { expiresIn: PRESIGNED_URL_EXPIRY_SECONDS });
}
