const supabase = require('../../config/supabase');

const getAll = async ({ convocatoria_id, status } = {}) => {
  let query = supabase
    .from('submissions')
    .select(`
      *,
      convocatorias ( title ),
      categories ( name, slug )
    `)
    .order('submitted_at', { ascending: false });

  if (convocatoria_id) query = query.eq('convocatoria_id', convocatoria_id);
  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

const getById = async (id) => {
  const { data, error } = await supabase
    .from('submissions')
    .select(`
      *,
      convocatorias ( title, closes_at ),
      categories ( name, slug )
    `)
    .eq('id', id)
    .single();

  if (error) throw { status: 404, message: 'Envío no encontrado' };
  return data;
};

const create = async (body) => {
  const {
    convocatoria_id, name, email, phone, city, country,
    bio, social_links, work_title, work_excerpt,
    category_id, files
  } = body;

  // Verificar que la convocatoria esté activa
  if (convocatoria_id) {
    const { data: conv } = await supabase
      .from('convocatorias')
      .select('is_active, closes_at')
      .eq('id', convocatoria_id)
      .single();

    if (!conv || !conv.is_active || new Date(conv.closes_at) < new Date()) {
      throw { status: 400, message: 'Esta convocatoria está cerrada' };
    }
  }

  const { data, error } = await supabase
    .from('submissions')
    .insert({
      convocatoria_id, name, email, phone, city, country,
      bio, social_links: social_links || {},
      work_title, work_excerpt, category_id,
      files: files || [],
      status: 'pending'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

const updateStatus = async (id, status, admin_notes, reviewed_by) => {
  const { data, error } = await supabase
    .from('submissions')
    .update({
      status,
      admin_notes,
      reviewed_by,
      reviewed_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

module.exports = { getAll, getById, create, updateStatus };