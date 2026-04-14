const supabase = require('../../config/supabase');
const { slugify } = require('../../utils/slugify');

const getAll = async () => {
  const { data, error } = await supabase
    .from('collaborators')
    .select(`
      id, name, slug, photo_url, bio, type,
      section_name, section_slug, social_links, is_active
    `)
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) throw error;
  return data;
};

const getBySlug = async (slug) => {
  const { data, error } = await supabase
    .from('collaborators')
    .select(`
      *,
      articles (
        id, title, slug, cover_image_url, excerpt,
        published_at, status,
        article_categories ( categories ( name, slug ) )
      )
    `)
    .eq('slug', slug)
    .eq('is_active', true)
    .eq('articles.status', 'published')
    .single();

  if (error) throw { status: 404, message: 'Colaborador no encontrado' };
  return data;
};

const create = async (body) => {
  const { name, bio, email, phone, type, section_name,
          section_description, social_links, photo_url } = body;

  const slug = slugify(name);
  let section_slug = null;
  if (type === 'fixed' && section_name) {
    section_slug = slugify(section_name);
  }

  const { data, error } = await supabase
    .from('collaborators')
    .insert({
      name, slug, bio, email, phone, type,
      section_name, section_slug, section_description,
      social_links: social_links || {},
      photo_url
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

const update = async (id, body) => {
  if (body.name) body.slug = slugify(body.name);
  if (body.section_name) body.section_slug = slugify(body.section_name);

  const { data, error } = await supabase
    .from('collaborators')
    .update(body)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

const remove = async (id) => {
  const { error } = await supabase
    .from('collaborators')
    .update({ is_active: false })
    .eq('id', id);

  if (error) throw error;
};

module.exports = { getAll, getBySlug, create, update, remove };