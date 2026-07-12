const supabase = require('../../config/supabase');
const { slugify } = require('../../utils/slugify');

/**
 * Busca y valida que la categoría seleccionada sea una sección hija
 * de la carpeta principal "Columnas".
 */
const getValidatedFixedCategory = async categoryId => {
  if (!categoryId) {
    throw {
      status: 400,
      message: 'Selecciona una columna fija para el colaborador',
    };
  }

  const { data: category, error: categoryError } = await supabase
    .from('categories')
    .select(`
      id,
      name,
      slug,
      parent_id,
      nav_type,
      content_type,
      fixed_collaborator_id,
      is_active
    `)
    .eq('id', categoryId)
    .maybeSingle();

  if (categoryError) throw categoryError;

  if (!category) {
    throw {
      status: 404,
      message: 'La columna seleccionada no existe',
    };
  }

  if (!category.parent_id || category.nav_type !== 'child') {
    throw {
      status: 400,
      message: 'La categoría seleccionada no es una sección hija',
    };
  }

  const { data: parent, error: parentError } = await supabase
    .from('categories')
    .select('id, name, slug, nav_type')
    .eq('id', category.parent_id)
    .maybeSingle();

  if (parentError) throw parentError;

  if (!parent || parent.slug !== 'columnas') {
    throw {
      status: 400,
      message: 'La sección seleccionada no pertenece a la carpeta Columnas',
    };
  }

  if (!category.is_active) {
    throw {
      status: 400,
      message: 'La columna seleccionada está despublicada',
    };
  }

  return category;
};

/**
 * Agrega a cada colaborador la columna que tiene vinculada.
 */
const attachFixedCategories = async collaborators => {
  if (!Array.isArray(collaborators) || collaborators.length === 0) {
    return [];
  }

  const collaboratorIds = collaborators.map(item => item.id);

  const { data: categories, error } = await supabase
    .from('categories')
    .select(`
      id,
      name,
      slug,
      fixed_collaborator_id,
      content_type,
      is_active
    `)
    .in('fixed_collaborator_id', collaboratorIds);

  if (error) throw error;

  const categoryByCollaborator = new Map(
    (categories || []).map(category => [
      category.fixed_collaborator_id,
      category,
    ])
  );

  return collaborators.map(collaborator => {
    const fixedCategory =
      categoryByCollaborator.get(collaborator.id) || null;

    return {
      ...collaborator,
      fixed_category_id: fixedCategory?.id || null,
      fixed_category: fixedCategory,
    };
  });
};

const getAll = async ({ q } = {}) => {
  let query = supabase
    .from('collaborators')
    .select(`
      id,
      name,
      slug,
      photo_url,
      bio,
      email,
      phone,
      type,
      section_name,
      section_slug,
      section_description,
      social_links,
      is_active
    `)
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (q?.trim()) {
    const search = q.trim();

    query = query.or(
      `name.ilike.%${search}%,bio.ilike.%${search}%,section_name.ilike.%${search}%`
    );
  }

  const { data, error } = await query;

  if (error) throw error;

  return attachFixedCategories(data || []);
};

const getBySlug = async slug => {
  const { data, error } = await supabase
    .from('collaborators')
    .select(`
      *,

      articles (
        id,
        title,
        slug,
        cover_image_url,
        excerpt,
        published_at,
        status,

        article_categories (
          categories (
            name,
            slug
          )
        )
      ),

      galleries (
        id,
        title,
        slug,
        subtitle,
        excerpt,
        cover_image_url,
        published_at,
        status,
        views,

        gallery_photos (
          id
        )
      )
    `)
    .eq('slug', slug)
    .eq('is_active', true)
    .eq(
      'articles.status',
      'published'
    )
    .eq(
      'galleries.status',
      'published'
    )
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw {
      status: 404,
      message:
        'Colaborador no encontrado',
    };
  }

  const normalizedGalleries =
    Array.isArray(
      data.galleries
    )
      ? data.galleries.map(
          gallery => ({
            ...gallery,

            photos_count:
              Array.isArray(
                gallery.gallery_photos
              )
                ? gallery
                    .gallery_photos
                    .length
                : 0,
          })
        )
      : [];

  const [
    collaboratorWithCategory,
  ] =
    await attachFixedCategories([
      {
        ...data,

        galleries:
          normalizedGalleries,
      },
    ]);

  return collaboratorWithCategory;
};

const create = async body => {
  const {
    name,
    bio,
    email,
    phone,
    type = 'occasional',
    section_description,
    social_links,
    photo_url,
    fixed_category_id,
  } = body;

  if (!name?.trim()) {
    throw {
      status: 400,
      message: 'El nombre del colaborador es obligatorio',
    };
  }

  let selectedCategory = null;

  if (type === 'fixed') {
    selectedCategory =
      await getValidatedFixedCategory(fixed_category_id);

    if (selectedCategory.fixed_collaborator_id) {
      throw {
        status: 409,
        message: `"${selectedCategory.name}" ya está asignada a otro colaborador`,
      };
    }
  }

  const collaboratorPayload = {
    name: name.trim(),
    slug: slugify(name.trim()),
    bio: bio || null,
    email: email || null,
    phone: phone || null,
    type,
    section_name:
      type === 'fixed' ? selectedCategory.name : null,
    section_slug:
      type === 'fixed' ? selectedCategory.slug : null,
    section_description:
      type === 'fixed' ? section_description || null : null,
    social_links: social_links || {},
    photo_url: photo_url || null,
  };

  const { data: collaborator, error: collaboratorError } =
    await supabase
      .from('collaborators')
      .insert(collaboratorPayload)
      .select()
      .single();

  if (collaboratorError) throw collaboratorError;

  if (type === 'fixed' && selectedCategory) {
    const { error: categoryError } = await supabase
      .from('categories')
      .update({
        content_type: 'fixed_column',
        fixed_collaborator_id: collaborator.id,
      })
      .eq('id', selectedCategory.id);

    if (categoryError) {
      // Limpieza compensatoria si falla la vinculación.
      await supabase
        .from('collaborators')
        .delete()
        .eq('id', collaborator.id);

      throw categoryError;
    }
  }

  const [result] = await attachFixedCategories([collaborator]);

  return result;
};

const update = async (id, body) => {
  const {
    fixed_category_id,
    ...editableBody
  } = body;

  const { data: currentCollaborator, error: currentError } =
    await supabase
      .from('collaborators')
      .select('*')
      .eq('id', id)
      .maybeSingle();

  if (currentError) throw currentError;

  if (!currentCollaborator) {
    throw {
      status: 404,
      message: 'Colaborador no encontrado',
    };
  }

  const { data: currentLinkedCategories, error: linkedError } =
    await supabase
      .from('categories')
      .select('id, name, slug, fixed_collaborator_id')
      .eq('fixed_collaborator_id', id);

  if (linkedError) throw linkedError;

  const currentCategory =
    currentLinkedCategories?.[0] || null;

  const nextType =
    editableBody.type || currentCollaborator.type;

  let selectedCategory = null;

  if (nextType === 'fixed') {
    selectedCategory =
      await getValidatedFixedCategory(fixed_category_id);

    const occupiedByAnother =
      selectedCategory.fixed_collaborator_id &&
      selectedCategory.fixed_collaborator_id !== id;

    if (occupiedByAnother) {
      throw {
        status: 409,
        message: `"${selectedCategory.name}" ya está asignada a otro colaborador`,
      };
    }
  }

  /*
   * Si cambió de columna o se volvió ocasional,
   * primero liberamos la anterior.
   */
  const shouldUnlinkCurrent =
    currentCategory &&
    (
      nextType !== 'fixed' ||
      currentCategory.id !== selectedCategory?.id
    );

  if (shouldUnlinkCurrent) {
    const { error: unlinkError } = await supabase
      .from('categories')
      .update({
        content_type: 'general',
        fixed_collaborator_id: null,
      })
      .eq('id', currentCategory.id);

    if (unlinkError) throw unlinkError;
  }

  /*
   * Vincular la nueva columna.
   */
  if (nextType === 'fixed' && selectedCategory) {
    const { error: linkError } = await supabase
      .from('categories')
      .update({
        content_type: 'fixed_column',
        fixed_collaborator_id: id,
      })
      .eq('id', selectedCategory.id);

    if (linkError) throw linkError;
  }

  const payload = {
    ...editableBody,
    type: nextType,
    section_name:
      nextType === 'fixed'
        ? selectedCategory.name
        : null,
    section_slug:
      nextType === 'fixed'
        ? selectedCategory.slug
        : null,
    section_description:
      nextType === 'fixed'
        ? editableBody.section_description || null
        : null,
  };

  if (payload.name) {
    payload.name = payload.name.trim();
    payload.slug = slugify(payload.name);
  }

  delete payload.fixed_category;
  delete payload.fixed_category_id;

  const { data, error } = await supabase
    .from('collaborators')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  const [result] = await attachFixedCategories([data]);

  return result;
};

const remove = async id => {
  /*
   * Liberar primero la columna asociada.
   */
  const { error: categoryError } = await supabase
    .from('categories')
    .update({
      content_type: 'general',
      fixed_collaborator_id: null,
    })
    .eq('fixed_collaborator_id', id);

  if (categoryError) throw categoryError;

  const { error } = await supabase
    .from('collaborators')
    .update({
      is_active: false,
      section_name: null,
      section_slug: null,
      section_description: null,
    })
    .eq('id', id);

  if (error) throw error;
};

module.exports = {
  getAll,
  getBySlug,
  create,
  update,
  remove,
};