const crypto = require('crypto');
const { convert } = require('html-to-text');

const normalizeSpeechText = (value) => {
  return String(value || '')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/https?:\/\/\S+/gi, ' ')
    .replace(/www\.\S+/gi, ' ')
    .replace(/\s+([,.!?;:])/g, '$1')
    .trim();
};

const htmlToSpeechText = ({
  title,
  subtitle,
  contentHtml,
}) => {
  const bodyText = convert(
    String(contentHtml || ''),
    {
      wordwrap: false,

      selectors: [
        {
          selector: 'img',
          format: 'skip',
        },
        {
          selector: 'picture',
          format: 'skip',
        },
        {
          selector: 'video',
          format: 'skip',
        },
        {
          selector: 'audio',
          format: 'skip',
        },
        {
          selector: 'iframe',
          format: 'skip',
        },
        {
          selector: 'figure',
          format: 'skip',
        },
        {
          selector: 'figcaption',
          format: 'skip',
        },
        {
          selector: 'script',
          format: 'skip',
        },
        {
          selector: 'style',
          format: 'skip',
        },
        {
          selector: 'svg',
          format: 'skip',
        },
        {
          selector: 'a',
          options: {
            ignoreHref: true,
          },
        },
      ],
    }
  );

  const sections = [
    title,
    subtitle,
    bodyText,
  ]
    .map(normalizeSpeechText)
    .filter(Boolean);

  return sections.join('\n\n');
};

const createSpeechHash = (text) => {
  return crypto
    .createHash('sha256')
    .update(String(text || ''))
    .digest('hex');
};

module.exports = {
  htmlToSpeechText,
  createSpeechHash,
};