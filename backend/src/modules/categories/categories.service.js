const supabase = require('../../config/supabase');
const { slugify } = require('../../utils/slugify');

/**
 * Convierte una lista plana de categorías en:
 *
 * [
 *   {
 *     ...padre,
 *     subcategories: [...]
 *   }
 * ]
 */
const buildCategoryTree = (categories = []) => {
  const parents = categories
    .filter(category =>
      category.nav_type === 'parent' ||
      !category.parent_id
    )
    .sort(
      (a, b) =>
        Number(a.display_order || 0) -
        Number(b.display_order || 0)
    );

  const children = categories
    .filter(category =>
      category.nav_type === 'child' &&
      Boolean(category.parent_id)
    )
    .sort(
      (a, b) =>
        Number(a.display_order || 0) -
        Number(b.display_order || 0)
    );

  return parents.map(parent => ({
    ...parent,

    subcategories: children.filter(
      child => child.parent_id === parent.id
    ),
  }));
};

/**
 * Categorías públicas.
 *
 * Solo devuelve:
 * - activas;
 * - visibles en la navbar.
 */
const getAll = async () => {
  const { data, error } = await supabase
    .from('categories')
    .select(`
      *,
fixed_collaborator:collaborators!categories_fixed_collaborator_id_fkey (
  id,
  name,
  slug,
  photo_url,
  bio,
  email,
  type,
  section_name,
  section_description,
  section_slug,
  social_links,
  is_active
)
    `)
    .eq('is_active', true)
    .eq('show_in_navbar', true)
    .order('display_order', {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  return buildCategoryTree(data || []);
};

/**
 * Categorías administrativas.
 *
 * Devuelve:
 * - padres;
 * - hijas;
 * - activas;
 * - inactivas;
 * - colaborador fijo asociado.
 */
const getAllAdmin = async () => {
  const { data, error } = await supabase
    .from('categories')
    .select(`
      *,
fixed_collaborator:collaborators!categories_fixed_collaborator_id_fkey (
  id,
  name,
  slug,
  photo_url,
  bio,
  email,
  type,
  section_name,
  section_description,
  section_slug,
  social_links,
  is_active
)
    `)
    .order('display_order', {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  return buildCategoryTree(data || []);
};

const getBySlug = async slug => {
  const { data, error } = await supabase
    .from('categories')
    .select(`
      *,
fixed_collaborator:collaborators!categories_fixed_collaborator_id_fkey (
  id,
  name,
  slug,
  photo_url,
  bio,
  email,
  type,
  section_name,
  section_description,
  section_slug,
  social_links,
  is_active
)
    `)
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw {
      status: 404,
      message: 'Categoría no encontrada',
    };
  }

  return data;
};

const create = async body => {
  const {
    name,
    description = null,
    icon = null,
    cover_image_url = null,
    color = '#8B1A4A',
    display_order = 0,
    has_dropdown = false,
    is_active = true,
    parent_id = null,
    nav_type,
    content_type,
    show_in_navbar = true,
    fixed_collaborator_id = null,
  } = body;

  if (!name || !name.trim()) {
    throw {
      status: 400,
      message: 'El nombre de la sección es obligatorio',
    };
  }

  const isChild = Boolean(parent_id);

  const payload = {
    name: name.trim(),
    slug: slugify(name.trim()),
    description:
      typeof description === 'string'
        ? description.trim() || null
        : null,
    icon,

    cover_image_url:
      typeof cover_image_url === 'string'
        ? cover_image_url.trim() || null
        : null,

    color,
    display_order: Number(display_order) || 0,
    is_active: Boolean(is_active),
    parent_id: isChild ? parent_id : null,
    nav_type:
      nav_type ||
      (isChild ? 'child' : 'parent'),
    content_type:
      content_type ||
      (isChild ? 'general' : 'system'),
    show_in_navbar: Boolean(show_in_navbar),
    fixed_collaborator_id:
      fixed_collaborator_id || null,
    has_dropdown: isChild
      ? false
      : Boolean(has_dropdown),
  };

  const { data, error } = await supabase
    .from('categories')
    .insert(payload)
    .select(`
      *,
fixed_collaborator:collaborators!categories_fixed_collaborator_id_fkey (
  id,
  name,
  slug,
  photo_url,
  bio,
  email,
  type,
  section_name,
  section_description,
  section_slug,
  social_links,
  is_active
)
    `)
    .single();

  if (error) {
    throw error;
  }

  return data;
};

const update = async (id, body) => {
  const payload = {
    ...body,
  };

  if (typeof payload.name === 'string') {
    const cleanName = payload.name.trim();

    if (!cleanName) {
      throw {
        status: 400,
        message: 'El nombre de la sección es obligatorio',
      };
    }

    payload.name = cleanName;
    payload.slug = slugify(cleanName);
  }

  if (
    Object.prototype.hasOwnProperty.call(
      payload,
      'description'
    )
  ) {
    payload.description =
      typeof payload.description === 'string'
        ? payload.description.trim() || null
        : null;
  }

  if (
    Object.prototype.hasOwnProperty.call(
      payload,
      'display_order'
    )
  ) {
    payload.display_order =
      Number(payload.display_order) || 0;
  }

  if (
    Object.prototype.hasOwnProperty.call(
      payload,
      'parent_id'
    )
  ) {
    payload.parent_id =
      payload.parent_id || null;
  }

  if (
    Object.prototype.hasOwnProperty.call(
      payload,
      'fixed_collaborator_id'
    )
  ) {
    payload.fixed_collaborator_id =
      payload.fixed_collaborator_id || null;
  }

  const { data, error } = await supabase
    .from('categories')
    .update(payload)
    .eq('id', id)
    .select(`
      *,
fixed_collaborator:collaborators!categories_fixed_collaborator_id_fkey (
  id,
  name,
  slug,
  photo_url,
  bio,
  email,
  type,
  section_name,
  section_description,
  section_slug,
  social_links,
  is_active
)
    `)
    .single();

  if (error) {
    throw error;
  }

  return data;
};

/**
 * No elimina físicamente.
 * La deja despublicada para poder recuperarla desde el panel.
 */
const remove = async id => {
  const { data, error } = await supabase
    .from('categories')
    .update({
      is_active: false,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

/**
 * Devuelve únicamente las columnas fijas públicas.
 *
 * Condiciones:
 * - pertenecen a la carpeta "Columnas";
 * - están activas;
 * - son de tipo fixed_column;
 * - tienen un colaborador fijo;
 * - están ordenadas por display_order.
 */
const getColumns = async () => {
  const { data: columnsParent, error: parentError } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', 'columnas')
    .eq('nav_type', 'parent')
    .maybeSingle();

  if (parentError) {
    throw parentError;
  }

  if (!columnsParent) {
    return [];
  }

  const { data, error } = await supabase
    .from('categories')
    .select(`
      *,
      fixed_collaborator:collaborators!categories_fixed_collaborator_id_fkey (
        id,
        name,
        slug,
        photo_url,
        bio,
        email,
        type,
        section_name,
        section_slug,
        social_links,
        is_active
      )
    `)
    .eq('parent_id', columnsParent.id)
    .eq('nav_type', 'child')
    .eq('content_type', 'fixed_column')
    .eq('is_active', true)
    .not('fixed_collaborator_id', 'is', null)
    .order('display_order', {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  return (data || []).filter(
    column =>
      column.fixed_collaborator &&
      column.fixed_collaborator.is_active !== false
  );
};

module.exports = {
  getAll,
  getAllAdmin,
  getColumns,
  getBySlug,
  create,
  update,
  remove,
};