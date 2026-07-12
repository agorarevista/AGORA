const supabase = require('../../config/supabase');
const {
  htmlToSpeechText,
  createSpeechHash,
} = require('./articleAudio.utils');

const VALID_VOICES = [
  'male',
  'female',
];

const getBucketName = () => {
  return (
    process.env.SUPABASE_AUDIO_BUCKET ||
    'article-audio'
  );
};

const getTtsServiceUrl = () => {
  const url = String(
    process.env.TTS_SERVICE_URL || ''
  ).replace(/\/+$/, '');

  if (!url) {
    throw {
      status: 500,
      message:
        'TTS_SERVICE_URL no está configurado.',
    };
  }

  return url;
};

const getTtsSecret = () => {
  const secret = process.env.TTS_INTERNAL_SECRET;

  if (!secret) {
    throw {
      status: 500,
      message:
        'TTS_INTERNAL_SECRET no está configurado.',
    };
  }

  return secret;
};

const getArticleForAudio = async (articleId) => {
  const { data, error } = await supabase
    .from('articles')
    .select(`
      id,
      title,
      subtitle,
      content_html,
      audio_male_url,
      audio_female_url,
      audio_male_path,
      audio_female_path,
      audio_male_duration,
      audio_female_duration,
      audio_male_hash,
      audio_female_hash,
      audio_status,
      audio_error
    `)
    .eq('id', articleId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw {
      status: 404,
      message: 'Artículo no encontrado.',
    };
  }

  return data;
};

const requestSpeechAudio = async ({
  text,
  voice,
}) => {
  const response = await fetch(
    `${getTtsServiceUrl()}/generate`,
    {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Secret': getTtsSecret(),
      },

      body: JSON.stringify({
        text,
        voice,
        rate: '-4%',
        pitch: '+0Hz',
        volume: '+0%',
      }),

      signal: AbortSignal.timeout(
        5 * 60 * 1000
      ),
    }
  );

  if (!response.ok) {
    let detail =
      'El servicio de voz no pudo generar el audio.';

    try {
      const errorPayload = await response.json();

      detail =
        errorPayload?.detail ||
        detail;
    } catch {
      // La respuesta no era JSON.
    }

    throw {
      status: 502,
      message: detail,
    };
  }

  const arrayBuffer =
    await response.arrayBuffer();

  const duration = Number(
    response.headers.get(
      'x-audio-duration'
    )
  );

  return {
    buffer: Buffer.from(arrayBuffer),

    duration:
      Number.isFinite(duration) &&
      duration > 0
        ? Math.round(duration)
        : null,
  };
};

const removeStoredAudio = async (path) => {
  if (!path) {
    return;
  }

  const { error } = await supabase
    .storage
    .from(getBucketName())
    .remove([path]);

  if (error) {
    console.warn(
      'No se pudo borrar audio anterior:',
      error.message
    );
  }
};

const uploadAudio = async ({
  articleId,
  voice,
  hash,
  buffer,
}) => {
  const shortHash = hash.slice(0, 16);

  const path =
    `${articleId}/${voice}-${shortHash}.mp3`;

  const { error } = await supabase
    .storage
    .from(getBucketName())
    .upload(
      path,
      buffer,
      {
        contentType: 'audio/mpeg',
        cacheControl: '31536000',
        upsert: true,
      }
    );

  if (error) {
    throw error;
  }

  const { data } = supabase
    .storage
    .from(getBucketName())
    .getPublicUrl(path);

  if (!data?.publicUrl) {
    throw {
      status: 500,
      message:
        'No se pudo obtener la URL pública del audio.',
    };
  }

  return {
    path,
    url: data.publicUrl,
  };
};

const generateVoice = async (
  articleId,
  voice
) => {
  if (!VALID_VOICES.includes(voice)) {
    throw {
      status: 400,
      message:
        'La voz debe ser male o female.',
    };
  }

  const article =
    await getArticleForAudio(articleId);

  const speechText = htmlToSpeechText({
    title: article.title,
    subtitle: article.subtitle,
    contentHtml: article.content_html,
  });

  if (!speechText) {
    throw {
      status: 400,
      message:
        'El artículo no tiene texto para narrar.',
    };
  }

  if (speechText.length > 100000) {
    throw {
      status: 400,
      message:
        'El artículo es demasiado largo para generar audio.',
    };
  }

  const hash = createSpeechHash(
    `${voice}:${speechText}`
  );

  const existingHash =
    voice === 'male'
      ? article.audio_male_hash
      : article.audio_female_hash;

  const existingUrl =
    voice === 'male'
      ? article.audio_male_url
      : article.audio_female_url;

  const existingDuration =
    voice === 'male'
      ? article.audio_male_duration
      : article.audio_female_duration;

  if (
    existingHash === hash &&
    existingUrl
  ) {
    return {
      reused: true,
      voice,
      url: existingUrl,
      duration: existingDuration,
    };
  }

  await supabase
    .from('articles')
    .update({
      audio_status: `generating_${voice}`,
      audio_error: null,
    })
    .eq('id', articleId);

  try {
    const generated =
      await requestSpeechAudio({
        text: speechText,
        voice,
      });

    const uploaded =
      await uploadAudio({
        articleId,
        voice,
        hash,
        buffer: generated.buffer,
      });

    const previousPath =
      voice === 'male'
        ? article.audio_male_path
        : article.audio_female_path;

    const updatePayload =
      voice === 'male'
        ? {
            audio_male_url:
              uploaded.url,

            audio_male_path:
              uploaded.path,

            audio_male_duration:
              generated.duration,

            audio_male_hash:
              hash,

            audio_status:
              'ready',

            audio_error:
              null,

            audio_updated_at:
              new Date().toISOString(),
          }
        : {
            audio_female_url:
              uploaded.url,

            audio_female_path:
              uploaded.path,

            audio_female_duration:
              generated.duration,

            audio_female_hash:
              hash,

            audio_status:
              'ready',

            audio_error:
              null,

            audio_updated_at:
              new Date().toISOString(),
          };

    const { data, error } = await supabase
      .from('articles')
      .update(updatePayload)
      .eq('id', articleId)
      .select(`
        id,
        audio_male_url,
        audio_female_url,
        audio_male_duration,
        audio_female_duration,
        audio_status,
        audio_error
      `)
      .single();

    if (error) {
      throw error;
    }

    if (
      previousPath &&
      previousPath !== uploaded.path
    ) {
      await removeStoredAudio(previousPath);
    }

    return {
      reused: false,
      voice,
      url: uploaded.url,
      duration: generated.duration,
      article: data,
    };
  } catch (error) {
    await supabase
      .from('articles')
      .update({
        audio_status: 'error',

        audio_error:
          error?.message ||
          'No se pudo generar el audio.',
      })
      .eq('id', articleId);

    throw error;
  }
};

const generateBoth = async (articleId) => {
  const [
    female,
    male,
  ] = await Promise.all([
    generateVoice(
      articleId,
      'female'
    ),

    generateVoice(
      articleId,
      'male'
    ),
  ]);

  return {
    female,
    male,
  };
};

const removeVoice = async (
  articleId,
  voice
) => {
  if (!VALID_VOICES.includes(voice)) {
    throw {
      status: 400,
      message:
        'La voz debe ser male o female.',
    };
  }

  const article =
    await getArticleForAudio(articleId);

  const path =
    voice === 'male'
      ? article.audio_male_path
      : article.audio_female_path;

  await removeStoredAudio(path);

  const updatePayload =
    voice === 'male'
      ? {
          audio_male_url: null,
          audio_male_path: null,
          audio_male_duration: null,
          audio_male_hash: null,
          audio_error: null,
        }
      : {
          audio_female_url: null,
          audio_female_path: null,
          audio_female_duration: null,
          audio_female_hash: null,
          audio_error: null,
        };

  const { data, error } = await supabase
    .from('articles')
    .update(updatePayload)
    .eq('id', articleId)
    .select(`
      id,
      audio_male_url,
      audio_female_url,
      audio_male_duration,
      audio_female_duration,
      audio_status,
      audio_error
    `)
    .single();

  if (error) {
    throw error;
  }

  return data;
};

module.exports = {
  generateVoice,
  generateBoth,
  removeVoice,
};