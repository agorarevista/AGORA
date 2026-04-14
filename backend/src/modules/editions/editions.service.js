const supabase = require('../../config/supabase');

const getAll = async () => {
  const { data, error } = await supabase
    .from('editions')
    .select('*')
    .order('number', { ascending: false });

  if (error) throw error;
  return data;
};

const getCurrent = async () => {
  const { data, error } = await supabase
    .from('editions')
    .select(`
      *,
      articles (
        id, title, slug, cover_image_url, excerpt,
        published_at, is_featured, featured_order,
        collaborators ( name, slug, photo_url ),
        article_categories ( categories ( name, slug ) )
      )
    `)
    .eq('is_current', true)
    .eq('articles.status', 'published')
    .single();

  if (error) throw { status: 404, message: 'No hay edición actual' };
  return data;
};

const getByNumber = async (number) => {
  const { data, error } = await supabase
    .from('editions')
    .select(`
      *,
      articles (
        id, title, slug, cover_image_url, excerpt, published_at,
        collaborators ( name, slug, photo_url ),
        article_categories ( categories ( name, slug ) )
      )
    `)
    .eq('number', number)
    .eq('articles.status', 'published')
    .single();

  if (error) throw { status: 404, message: 'Edición no encontrada' };
  return data;
};

const create = async (body) => {
  const { data, error } = await supabase
    .from('editions')
    .insert(body)
    .select()
    .single();

  if (error) throw error;
  return data;
};

const update = async (id, body) => {
  const { data, error } = await supabase
    .from('editions')
    .update(body)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

const setCurrent = async (id) => {
  // Quitar current de todas
  await supabase
    .from('editions')
    .update({ is_current: false })
    .neq('id', id);

  // Poner current en la seleccionada
  const { data, error } = await supabase
    .from('editions')
    .update({ is_current: true })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

module.exports = { getAll, getCurrent, getByNumber, create, update, setCurrent };