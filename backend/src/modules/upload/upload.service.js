const {
  PutObjectCommand,
  DeleteObjectCommand,
} = require('@aws-sdk/client-s3');

const crypto = require('crypto');
const path = require('path');

const r2Client = require('../../config/cloudflare');

const BUCKET =
  process.env.R2_BUCKET_NAME;

const PUBLIC_URL =
  process.env.R2_PUBLIC_URL;

const sanitizeFolder = (
  folder = 'misc'
) => {
  const sanitized = String(folder)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9/_-]/g, '')
    .replace(/\/+/g, '/')
    .replace(/^\/|\/$/g, '');

  return sanitized || 'misc';
};

const sanitizeExtension = (
  filename = ''
) => {
  const extension =
    path
      .extname(filename)
      .toLowerCase();

  return extension.replace(
    /[^a-z0-9.]/g,
    ''
  );
};

const extensionFromMime = (
  mimeType = ''
) => {
  const map = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'image/avif': '.avif',
    'image/svg+xml': '.svg',
  };

  return map[mimeType] || '';
};

const getPublicFileUrl = key => {
  const cleanBaseUrl =
    String(PUBLIC_URL || '')
      .replace(/\/+$/, '');

  const encodedKey = key
    .split('/')
    .map(segment =>
      encodeURIComponent(segment)
    )
    .join('/');

  return `${cleanBaseUrl}/${encodedKey}`;
};

const validateEnvironment = () => {
  if (!BUCKET) {
    throw new Error(
      'Falta configurar R2_BUCKET_NAME'
    );
  }

  if (!PUBLIC_URL) {
    throw new Error(
      'Falta configurar R2_PUBLIC_URL'
    );
  }
};

const createObjectKey = ({
  folder,
  filename,
  contentType,
}) => {
  const safeFolder =
    sanitizeFolder(folder);

  const extension =
    sanitizeExtension(filename) ||
    extensionFromMime(contentType);

  const randomId =
    crypto
      .randomBytes(12)
      .toString('hex');

  return [
    safeFolder,
    `${Date.now()}-${randomId}${extension}`,
  ].join('/');
};

const uploadBuffer = async ({
  buffer,
  filename = 'archivo',
  contentType =
    'application/octet-stream',
  folder = 'misc',
  metadata = {},
}) => {
  validateEnvironment();

  if (!Buffer.isBuffer(buffer)) {
    throw new Error(
      'El contenido recibido no es un Buffer válido'
    );
  }

  const key = createObjectKey({
    folder,
    filename,
    contentType,
  });

  const safeMetadata =
    Object.fromEntries(
      Object.entries(metadata)
        .filter(([, value]) =>
          value !== undefined &&
          value !== null
        )
        .map(([name, value]) => [
          String(name)
            .toLowerCase()
            .replace(/[^a-z0-9_-]/g, ''),
          encodeURIComponent(
            String(value)
          ),
        ])
    );

  const command =
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ContentLength: buffer.length,
      CacheControl:
        'public, max-age=31536000, immutable',

      Metadata: {
        originalname:
          encodeURIComponent(filename),
        ...safeMetadata,
      },
    });

  await r2Client.send(command);

  return {
    key,
    url: getPublicFileUrl(key),
    size: buffer.length,
    type: contentType,
    name: filename,
  };
};

const uploadFile = async (
  file,
  folder = 'misc'
) => {
  if (!file?.buffer) {
    throw new Error(
      'El archivo recibido no contiene datos'
    );
  }

  const result =
    await uploadBuffer({
      buffer: file.buffer,
      filename:
        file.originalname ||
        'archivo',
      contentType:
        file.mimetype ||
        'application/octet-stream',
      folder,

      metadata: {
        uploadcategory:
          file.uploadCategory ||
          'general',
      },
    });

  return {
    ...result,
    category:
      file.uploadCategory ||
      null,
  };
};

const deleteFile = async key => {
  validateEnvironment();

  if (
    !key ||
    typeof key !== 'string'
  ) {
    throw new Error(
      'La key del archivo no es válida'
    );
  }

  const command =
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    });

  await r2Client.send(command);
};

module.exports = {
  uploadFile,
  uploadBuffer,
  deleteFile,
};