const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const r2Client = require('../../config/cloudflare');
const crypto = require('crypto');
const path = require('path');

const BUCKET = process.env.R2_BUCKET_NAME;
const PUBLIC_URL = process.env.R2_PUBLIC_URL;

const uploadFile = async (file, folder = 'misc') => {
  const ext = path.extname(file.originalname);
  const uniqueName = `${folder}/${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: uniqueName,
    Body: file.buffer,
    ContentType: file.mimetype,
    CacheControl: 'public, max-age=31536000'
  });

  await r2Client.send(command);

  return {
    key: uniqueName,
    url: `${PUBLIC_URL}/${uniqueName}`,
    size: file.size,
    type: file.mimetype,
    name: file.originalname
  };
};

const deleteFile = async (key) => {
  const command = new DeleteObjectCommand({ Bucket: BUCKET, Key: key });
  await r2Client.send(command);
};

module.exports = { uploadFile, deleteFile };