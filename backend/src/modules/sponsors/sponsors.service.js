const supabase = require('../../config/supabase');

const TABLE = 'sponsors_news';

const getPublic = async () => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

const getAll = async () => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

const getById = async (id) => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw { status: 404, message: 'Elemento no encontrado' };
  return data;
};

const create = async (body) => {
  const {
    type = 'noticia', title, body: text, image_url,
    link_url, display_order = 0, is_active = true
  } = body;

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      type,
      title,
      body: text || null,
      image_url: image_url || null,
      link_url: link_url || null,
      display_order,
      is_active
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

const update = async (id, body) => {
  const {
    type, title, body: text, image_url,
    link_url, display_order, is_active
  } = body;

  const patch = {};
  if (type !== undefined)          patch.type = type;
  if (title !== undefined)         patch.title = title;
  if (text !== undefined)          patch.body = text;
  if (image_url !== undefined)     patch.image_url = image_url;
  if (link_url !== undefined)      patch.link_url = link_url;
  if (display_order !== undefined) patch.display_order = display_order;
  if (is_active !== undefined)     patch.is_active = is_active;

  const { data, error } = await supabase
    .from(TABLE)
    .update(patch)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

const remove = async (id) => {
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('id', id);

  if (error) throw error;
};

module.exports = { getPublic, getAll, getById, create, update, remove };