const supabase = require('../../config/supabase');
const { slugify } = require('../../utils/slugify');

const getAll = async () => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) throw error;

  // Separar padres e hijos
  const parents = data.filter(c => !c.parent_id);
  const children = data.filter(c => c.parent_id);

  // Anidar hijos dentro de sus padres
  return parents.map(p => ({
    ...p,
    subcategories: children.filter(c => c.parent_id === p.id)
  }));
};

const getBySlug = async (slug) => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error) throw { status: 404, message: 'Categoría no encontrada' };
  return data;
};

const create = async (body) => {
  const { name, description, icon, color, display_order, has_dropdown } = body;
  const slug = slugify(name);

  const { data, error } = await supabase
    .from('categories')
    .insert({ name, slug, description, icon, color, display_order, has_dropdown })
    .select()
    .single();

  if (error) throw error;
  return data;
};

const update = async (id, body) => {
  if (body.name) body.slug = slugify(body.name);

  const { data, error } = await supabase
    .from('categories')
    .update(body)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

const remove = async (id) => {
  const { error } = await supabase
    .from('categories')
    .update({ is_active: false })
    .eq('id', id);

  if (error) throw error;
};

module.exports = { getAll, getBySlug, create, update, remove };