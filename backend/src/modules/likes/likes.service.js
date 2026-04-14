const supabase = require('../../config/supabase');
const crypto = require('crypto');

const getFingerprint = (req) => {
  const data = (req.ip || '') + (req.headers['user-agent'] || '');
  return crypto.createHash('sha256').update(data).digest('hex');
};

const getLikes = async (article_id) => {
  const { count, error } = await supabase
    .from('article_likes')
    .select('*', { count: 'exact', head: true })
    .eq('article_id', article_id);

  if (error) throw error;
  return { article_id, likes: count };
};

const toggleLike = async (article_id, req) => {
  const fingerprint = getFingerprint(req);

  // Verificar si ya dio like
  const { data: existing } = await supabase
    .from('article_likes')
    .select('id')
    .eq('article_id', article_id)
    .eq('fingerprint', fingerprint)
    .single();

  if (existing) {
    // Quitar like
    await supabase
      .from('article_likes')
      .delete()
      .eq('id', existing.id);

    const { count } = await supabase
      .from('article_likes')
      .select('*', { count: 'exact', head: true })
      .eq('article_id', article_id);

    return { liked: false, likes: count };
  } else {
    // Dar like
    await supabase
      .from('article_likes')
      .insert({ article_id, fingerprint });

    const { count } = await supabase
      .from('article_likes')
      .select('*', { count: 'exact', head: true })
      .eq('article_id', article_id);

    return { liked: true, likes: count };
  }
};

const checkLike = async (article_id, req) => {
  const fingerprint = getFingerprint(req);
  const { data } = await supabase
    .from('article_likes')
    .select('id')
    .eq('article_id', article_id)
    .eq('fingerprint', fingerprint)
    .single();

  return { liked: !!data };
};

module.exports = { getLikes, toggleLike, checkLike };