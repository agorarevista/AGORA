const supabase = require('../../config/supabase');
const { slugify } = require('../../utils/slugify');
const { readingTime } = require('../../utils/readingTime');
const { publishToSubstack } = require('../substack/substack.service');

// Campos base para listados
const BASE_SELECT = `
  id, title, slug, subtitle, excerpt, cover_image_url,
  published_at, status, views, reading_time, is_featured, featured_order,
  collaborators ( id, name, slug, photo_url, type, section_name, section_slug, social_links ),
  editions ( id, number, name ),
  article_categories ( categories ( id, name, slug, color ) ),
  article_tags ( tag, tag_type )
`;

// Campos completos para edición individual
const EDITOR_SELECT = `
  id,
  title,
  slug,
  subtitle,
  excerpt,
  content,
  content_html,
  cover_image_url,
  collaborator_id,
  edition_id,
  published_at,
  status,
  views,
  reading_time,
  is_featured,
  featured_order,
  collaborators ( id, name, slug, photo_url, type, section_name, section_slug, social_links ),
  editions ( id, number, name ),
  article_categories ( categories ( id, name, slug, color ) ),
  article_tags ( id, tag, tag_type )
`;

const getAll = async ({ page = 1, limit = 12, status = 'published' } = {}) => {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from('articles')
    .select(BASE_SELECT, { count: 'exact' })
    .eq('status', status)
    .order('published_at', { ascending: false })
    .range(from, to);

  if (error) throw error;
  return { data, total: count, page: Number(page), limit: Number(limit) };
};

const getBySlug = async (slug) => {
  const { data, error } = await supabase
    .from('articles')
    .select(BASE_SELECT + ', content_html')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (error) {
    console.error('articles.service.getBySlug error:', error);
    throw error;
  }

  if (!data) {
    throw { status: 404, message: 'Artículo no encontrado' };
  }

  // Incrementar vistas
  await supabase
    .from('articles')
    .update({ views: (data.views || 0) + 1 })
    .eq('id', data.id);

  return data;
};

const getById = async (id) => {
  const { data, error } = await supabase
    .from('articles')
    .select(EDITOR_SELECT)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('articles.service.getById error:', error);
    throw error;
  }

  if (!data) {
    throw { status: 404, message: 'Artículo no encontrado' };
  }

  return data;
};
const getByCategory = async (slug, { page = 1, limit = 12 } = {}) => {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // Primero obtener el id de la categoría
  const { data: cat } = await supabase
    .from('categories')
    .select('id, name, slug, description, cover_image_url')
    .eq('slug', slug)
    .single();

  if (!cat) throw { status: 404, message: 'Categoría no encontrada' };

  // Obtener artículos de esa categoría
  const { data, error, count } = await supabase
    .from('article_categories')
    .select(`
      articles (
        ${BASE_SELECT}
      )
    `, { count: 'exact' })
    .eq('category_id', cat.id)
    .eq('articles.status', 'published')
    .order('articles(published_at)', { ascending: false })
    .range(from, to);

  if (error) throw error;

  const articles = data
    .map(r => r.articles)
    .filter(Boolean);

  return { category: cat, data: articles, total: count, page: Number(page), limit: Number(limit) };
};

const getByCollaborator = async (slug, { page = 1, limit = 12 } = {}) => {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data: collab } = await supabase
    .from('collaborators')
    .select('id, name, slug, photo_url, bio, type, section_name, social_links')
    .eq('slug', slug)
    .single();

  if (!collab) throw { status: 404, message: 'Colaborador no encontrado' };

  const { data, error, count } = await supabase
    .from('articles')
    .select(BASE_SELECT, { count: 'exact' })
    .eq('collaborator_id', collab.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range(from, to);

  if (error) throw error;
  return { collaborator: collab, data, total: count, page: Number(page), limit: Number(limit) };
};

const getByEdition = async (number, { page = 1, limit = 50 } = {}) => {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data: edition } = await supabase
    .from('editions')
    .select('*')
    .eq('number', number)
    .single();

  if (!edition) throw { status: 404, message: 'Edición no encontrada' };

  const { data, error, count } = await supabase
    .from('articles')
    .select(BASE_SELECT, { count: 'exact' })
    .eq('edition_id', edition.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range(from, to);

  if (error) throw error;
  return { edition, data, total: count, page: Number(page), limit: Number(limit) };
};

const getFeatured = async () => {
  const { data, error } = await supabase
    .from('articles')
    .select(BASE_SELECT)
    .eq('status', 'published')
    .eq('is_featured', true)
    .order('featured_order', { ascending: true })
    .limit(6);

  if (error) throw error;
  return data;
};

const search = async (query, { page = 1, limit = 12 } = {}) => {
  if (!query || query.trim().length < 2) {
    throw { status: 400, message: 'La búsqueda debe tener al menos 2 caracteres' };
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from('articles')
    .select(BASE_SELECT, { count: 'exact' })
    .eq('status', 'published')
    .or(`title.ilike.%${query}%,excerpt.ilike.%${query}%`)
    .order('published_at', { ascending: false })
    .range(from, to);

  if (error) throw error;
  return { data, total: count, query, page: Number(page), limit: Number(limit) };
};

const create = async (body) => {
  const {
    title, subtitle, excerpt, content, content_html,
    cover_image_url, collaborator_id, edition_id,
    is_featured, featured_order, category_ids = [], tags = []
  } = body;

  const slug = slugify(title) + '-' + Date.now();
  const reading_time = content_html ? readingTime(content_html) : 1;

  const { data: article, error } = await supabase
    .from('articles')
    .insert({
      title, slug, subtitle, excerpt, content, content_html,
      cover_image_url, collaborator_id, edition_id,
      is_featured: is_featured || false,
      featured_order, reading_time,
      status: 'draft'
    })
    .select()
    .single();

  if (error) throw error;

  // Insertar categorías
  if (category_ids.length > 0) {
    const catRows = category_ids.map(id => ({
      article_id: article.id,
      category_id: id
    }));
    await supabase.from('article_categories').insert(catRows);
  }

  // Insertar tags
  if (tags.length > 0) {
    const tagRows = tags.map(t => ({
      article_id: article.id,
      tag: t.tag,
      tag_type: t.tag_type || null
    }));
    await supabase.from('article_tags').insert(tagRows);
  }

  return article;
};

const update = async (id, body) => {
  const { category_ids, tags, content_html, title, ...rest } = body;

  if (title) rest.slug = slugify(title) + '-' + Date.now();
  if (content_html) {
    rest.content_html = content_html;
    rest.reading_time = readingTime(content_html);
  }

  const { data: article, error } = await supabase
    .from('articles')
    .update(rest)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  // Actualizar categorías si vienen
  if (category_ids !== undefined) {
    await supabase.from('article_categories').delete().eq('article_id', id);
    if (category_ids.length > 0) {
      const catRows = category_ids.map(cat_id => ({ article_id: id, category_id: cat_id }));
      await supabase.from('article_categories').insert(catRows);
    }
  }

  // Actualizar tags si vienen
  if (tags !== undefined) {
    await supabase.from('article_tags').delete().eq('article_id', id);
    if (tags.length > 0) {
      const tagRows = tags.map(t => ({ article_id: id, tag: t.tag, tag_type: t.tag_type || null }));
      await supabase.from('article_tags').insert(tagRows);
    }
  }

  return article;
};

const publish = async (id) => {
  const { data: article, error } = await supabase
    .from('articles')
    .update({
      status: 'published',
      published_at: new Date().toISOString()
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;

  // Intentar crosspost a Substack (no falla si no está configurado)
  if (process.env.SUBSTACK_URL && process.env.SUBSTACK_COOKIE) {
    const substackUrl = await publishToSubstack(article);
    if (substackUrl) {
      await supabase
        .from('articles')
        .update({ substack_url: substackUrl })
        .eq('id', id);
    }
  }

  return article;
};

const remove = async (id) => {
  const { error } = await supabase
    .from('articles')
    .update({ status: 'archived' })
    .eq('id', id);

  if (error) throw error;
};

module.exports = {
  getAll, getBySlug, getById, getByCategory, getByCollaborator,
  getByEdition, getFeatured, search, create, update, publish, remove
};