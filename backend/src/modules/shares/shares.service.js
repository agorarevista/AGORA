const supabase = require('../../config/supabase');

const PLATFORMS = ['whatsapp', 'facebook', 'instagram', 'copy', 'twitter'];

const registerShare = async (article_id, platform) => {
  if (!PLATFORMS.includes(platform)) {
    throw { status: 400, message: 'Plataforma no válida' };
  }

  await supabase
    .from('article_shares')
    .insert({ article_id, platform });

  return { ok: true };
};

const getSharesByArticle = async (article_id) => {
  const { data, error } = await supabase
    .from('article_shares')
    .select('platform')
    .eq('article_id', article_id);

  if (error) throw error;

  const summary = PLATFORMS.reduce((acc, p) => {
    acc[p] = data.filter(s => s.platform === p).length;
    return acc;
  }, {});

  return { article_id, shares: summary, total: data.length };
};

module.exports = { registerShare, getSharesByArticle };