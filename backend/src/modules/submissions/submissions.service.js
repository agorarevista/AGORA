const supabase = require('../../config/supabase');

const getAll = async ({ convocatoria_id, status } = {}) => {
  let query = supabase
    .from('submissions')
    .select('*')
    .order('submitted_at', { ascending: false, nullsFirst: false });

  if (convocatoria_id) query = query.eq('convocatoria_id', convocatoria_id);
  if (status)          query = query.eq('status', status);

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

const getById = async (id) => {
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw { status: 404, message: 'Envío no encontrado' };
  return data;
};

const create = async (body) => {
  const {
    convocatoria_id,
    author_name, author_email,
    title, excerpt, content,
    category, file_url, notes
  } = body;

  // Verificar que la convocatoria esté activa
  if (convocatoria_id) {
    const { data: conv } = await supabase
      .from('convocatorias')
      .select('is_active, closes_at')
      .eq('id', convocatoria_id)
      .single();

    if (conv && conv.closes_at && new Date(conv.closes_at) < new Date()) {
      throw { status: 400, message: 'Esta convocatoria ya cerró' };
    }
    if (conv && !conv.is_active) {
      throw { status: 400, message: 'Esta convocatoria está cerrada' };
    }
  }

  const { data, error } = await supabase
    .from('submissions')
    .insert({
      convocatoria_id,
      author_name,
      author_email,
      title,
      excerpt,
      content,
      category,
      file_url,
      notes,
      status: 'pending'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

const update = async (id, body) => {
  const { data, error } = await supabase
    .from('submissions')
    .update({
      ...body,
      reviewed_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

const remove = async (id) => {
  const { error } = await supabase
    .from('submissions')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

module.exports = { getAll, getById, create, update, remove };