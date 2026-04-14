const supabase = require('../../config/supabase');

const getAll = async () => {
  const { data, error } = await supabase
    .from('convocatorias')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

const getActive = async () => {
  const { data, error } = await supabase
    .from('convocatorias')
    .select('*')
    .eq('is_active', true)
    .gt('closes_at', new Date().toISOString())
    .order('closes_at', { ascending: true });

  if (error) throw error;
  return data;
};

const getById = async (id) => {
  const { data, error } = await supabase
    .from('convocatorias')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw { status: 404, message: 'Convocatoria no encontrada' };
  return data;
};

const create = async (body) => {
  const { data, error } = await supabase
    .from('convocatorias')
    .insert(body)
    .select()
    .single();

  if (error) throw error;
  return data;
};

const update = async (id, body) => {
  const { data, error } = await supabase
    .from('convocatorias')
    .update(body)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

const remove = async (id) => {
  const { error } = await supabase
    .from('convocatorias')
    .update({ is_active: false })
    .eq('id', id);

  if (error) throw error;
};

// Llamada por el cron job cada hora
const autoCloseConvocatorias = async () => {
  const { error } = await supabase
    .from('convocatorias')
    .update({ is_active: false })
    .lt('closes_at', new Date().toISOString())
    .eq('is_active', true);

  if (error) console.error('Error auto-cerrando convocatorias:', error.message);
};

module.exports = { getAll, getActive, getById, create, update, remove, autoCloseConvocatorias };