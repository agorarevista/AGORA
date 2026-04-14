const supabase = require('../../config/supabase');
const crypto = require('crypto');

const trackView = async (req, body) => {
  const { path, article_id, category_slug } = body;
  const ua = req.headers['user-agent'] || '';
  const fingerprint = crypto
    .createHash('sha256')
    .update((req.ip || '') + ua)
    .digest('hex');

  const device_type = /mobile/i.test(ua)
    ? 'mobile' : /tablet/i.test(ua)
    ? 'tablet' : 'desktop';

  await supabase.from('page_views').insert({
    path,
    article_id: article_id || null,
    category_slug: category_slug || null,
    referrer: req.headers.referer || null,
    device_type,
    fingerprint
  });

  return { ok: true };
};

const getDashboardStats = async (days = 30) => {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceISO = since.toISOString();

  // Vistas por día
  const { data: viewsByDay } = await supabase
    .from('page_views')
    .select('created_at, fingerprint')
    .gte('created_at', sinceISO)
    .order('created_at', { ascending: true });

  // Agrupar por día
  const byDay = {};
  const uniqueByDay = {};
  (viewsByDay || []).forEach(v => {
    const day = v.created_at.split('T')[0];
    byDay[day] = (byDay[day] || 0) + 1;
    if (!uniqueByDay[day]) uniqueByDay[day] = new Set();
    uniqueByDay[day].add(v.fingerprint);
  });

  const viewsChart = Object.entries(byDay).map(([date, views]) => ({
    date,
    views,
    unique: uniqueByDay[date]?.size || 0
  }));

  // Vistas por categoría
  const { data: byCategory } = await supabase
    .from('page_views')
    .select('category_slug')
    .gte('created_at', sinceISO)
    .not('category_slug', 'is', null);

  const categoryCount = {};
  (byCategory || []).forEach(v => {
    categoryCount[v.category_slug] = (categoryCount[v.category_slug] || 0) + 1;
  });
  const categoriesChart = Object.entries(categoryCount)
    .map(([name, views]) => ({ name, views }))
    .sort((a, b) => b.views - a.views);

  // Dispositivos
  const { data: byDevice } = await supabase
    .from('page_views')
    .select('device_type')
    .gte('created_at', sinceISO);

  const deviceCount = {};
  (byDevice || []).forEach(v => {
    deviceCount[v.device_type] = (deviceCount[v.device_type] || 0) + 1;
  });
  const devicesChart = Object.entries(deviceCount)
    .map(([name, value]) => ({ name, value }));

  // Artículos más vistos
  const { data: topArticles } = await supabase
    .from('articles')
    .select('id, title, slug, views, cover_image_url, collaborators(name)')
    .eq('status', 'published')
    .order('views', { ascending: false })
    .limit(10);

  // Artículos más compartidos
  const { data: topShares } = await supabase
    .from('article_shares')
    .select('article_id, platform, articles(title, slug)')
    .gte('created_at', sinceISO);

  const sharesCount = {};
  (topShares || []).forEach(s => {
    if (!sharesCount[s.article_id]) {
      sharesCount[s.article_id] = {
        article: s.articles,
        total: 0,
        platforms: {}
      };
    }
    sharesCount[s.article_id].total += 1;
    sharesCount[s.article_id].platforms[s.platform] =
      (sharesCount[s.article_id].platforms[s.platform] || 0) + 1;
  });
  const topSharedArticles = Object.values(sharesCount)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  // Artículos más gustados
  const { data: topLikes } = await supabase
    .from('article_likes')
    .select('article_id, articles(title, slug, cover_image_url)')
    .gte('created_at', sinceISO);

  const likesCount = {};
  (topLikes || []).forEach(l => {
    if (!likesCount[l.article_id]) {
      likesCount[l.article_id] = { article: l.articles, likes: 0 };
    }
    likesCount[l.article_id].likes += 1;
  });
  const topLikedArticles = Object.values(likesCount)
    .sort((a, b) => b.likes - a.likes)
    .slice(0, 10);

  // Totales generales
  const totalViews = viewsByDay?.length || 0;
  const uniqueVisitors = new Set(viewsByDay?.map(v => v.fingerprint)).size;

  return {
    period: { days, since: sinceISO },
    totals: { views: totalViews, unique_visitors: uniqueVisitors },
    charts: {
      viewsByDay: viewsChart,
      byCategory: categoriesChart,
      byDevice: devicesChart
    },
    top: {
      articles: topArticles || [],
      shared: topSharedArticles,
      liked: topLikedArticles
    }
  };
};

module.exports = { trackView, getDashboardStats };