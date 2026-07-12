const {
  PutObjectCommand,
  DeleteObjectCommand,
} = require('@aws-sdk/client-s3');

const crypto = require('crypto');
const path = require('path');

const r2Client = require('../../config/cloudflare');

const BUCKET = process.env.R2_BUCKET_NAME;
const PUBLIC_URL = process.env.R2_PUBLIC_URL;

const sanitizeFolder = (folder = 'misc') => {
  const sanitized = String(folder)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9/_-]/g, '')
    .replace(/\/+/g, '/')
    .replace(/^\/|\/$/g, '');

  return sanitized || 'misc';
};

const sanitizeExtension = (filename = '') => {
  const extension = path.extname(filename).toLowerCase();

  return extension.replace(/[^a-z0-9.]/g, '');
};

const getPublicFileUrl = (key) => {
  const cleanBaseUrl = String(PUBLIC_URL || '').replace(/\/+$/, '');
  const encodedKey = key
    .split('/')
    .map(segment => encodeURIComponent(segment))
    .join('/');

  return `${cleanBaseUrl}/${encodedKey}`;
};

const validateEnvironment = () => {
  if (!BUCKET) {
    throw new Error('Falta configurar R2_BUCKET_NAME');
  }

  if (!PUBLIC_URL) {
    throw new Error('Falta configurar R2_PUBLIC_URL');
  }
};

const uploadFile = async (file, folder = 'misc') => {
  validateEnvironment();

  if (!file?.buffer) {
    throw new Error('El archivo recibido no contiene datos');
  }

  const safeFolder = sanitizeFolder(folder);
  const extension = sanitizeExtension(file.originalname);
  const randomId = crypto.randomBytes(12).toString('hex');

  const uniqueName = [
    safeFolder,
    `${Date.now()}-${randomId}${extension}`,
  ].join('/');

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: uniqueName,
    Body: file.buffer,
    ContentType: file.mimetype || 'application/octet-stream',
    ContentLength: file.size,
    CacheControl: 'public, max-age=31536000, immutable',

    Metadata: {
      originalname: encodeURIComponent(file.originalname || 'archivo'),
      uploadcategory: file.uploadCategory || 'general',
    },
  });

  await r2Client.send(command);

  return {
    key: uniqueName,
    url: getPublicFileUrl(uniqueName),
    size: file.size,
    type: file.mimetype,
    name: file.originalname,
    category: file.uploadCategory || null,
  };
};

const deleteFile = async (key) => {
  validateEnvironment();

  if (!key || typeof key !== 'string') {
    throw new Error('La key del archivo no es válida');
  }

  const command = new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });

  await r2Client.send(command);
};

module.exports = {
  uploadFile,
  deleteFile,
};