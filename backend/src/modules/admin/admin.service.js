const supabase = require('../../config/supabase');
const bcrypt = require('bcryptjs');
const { slugify } = require('../../utils/slugify');
const { generateTempPassword } = require('../../utils/generatePassword');

const getDashboard = async () => {
  const [articles, collaborators, editions, submissions, convocatorias] = await Promise.all([
    supabase.from('articles').select('id, status, views, published_at', { count: 'exact' }),
    supabase.from('collaborators').select('id, type', { count: 'exact' }).eq('is_active', true),
    supabase.from('editions').select('id, number, name, is_current', { count: 'exact' }),
    supabase.from('submissions').select('id, status', { count: 'exact' }),
    supabase.from('convocatorias').select('id, is_active', { count: 'exact' }),
  ]);

  const published = articles.data?.filter(a => a.status === 'published').length || 0;
  const drafts = articles.data?.filter(a => a.status === 'draft').length || 0;
  const totalViews = articles.data?.reduce((acc, a) => acc + (a.views || 0), 0) || 0;
  const pendingSubmissions = submissions.data?.filter(s => s.status === 'pending').length || 0;
  const currentEdition = editions.data?.find(e => e.is_current);

  return {
    articles: { total: articles.count, published, drafts, totalViews },
    collaborators: { total: collaborators.count },
    editions: { total: editions.count, current: currentEdition },
    submissions: { total: submissions.count, pending: pendingSubmissions },
    convocatorias: { total: convocatorias.count }
  };
};

const getUsers = async () => {
  const { data, error } = await supabase
    .from('admin_users')
    .select('id, full_name, username, role, avatar_url, is_active, last_login, created_at')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

const createUser = async (body, createdBy) => {
  const { full_name, username, role, avatar_url } = body;
  const tempPassword = generateTempPassword();
  const hash = await bcrypt.hash(tempPassword, 12);

  const { data, error } = await supabase
    .from('admin_users')
    .insert({
      full_name,
      username,
      password_hash: hash,
      role: role || 'editor',
      avatar_url,
      must_change_password: true,
      temp_password: tempPassword,
      created_by: createdBy
    })
    .select('id, full_name, username, role, must_change_password')
    .single();

  if (error) throw error;

  return {
    ...data,
    temp_password: tempPassword // Solo se devuelve al crearlo
  };
};

const updateUser = async (id, body) => {
  const { full_name, role, avatar_url } = body;

  const { data, error } = await supabase
    .from('admin_users')
    .update({ full_name, role, avatar_url })
    .eq('id', id)
    .select('id, full_name, username, role, avatar_url')
    .single();

  if (error) throw error;
  return data;
};

const toggleUser = async (id) => {
  const { data: user } = await supabase
    .from('admin_users')
    .select('is_active')
    .eq('id', id)
    .single();

  const { data, error } = await supabase
    .from('admin_users')
    .update({ is_active: !user.is_active })
    .eq('id', id)
    .select('id, username, is_active')
    .single();

  if (error) throw error;
  return data;
};

const getSiteConfig = async () => {
  const { data, error } = await supabase
    .from('site_config')
    .select('key, value, description');

  if (error) throw error;

  // Convertir array a objeto
  return data.reduce((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, {});
};

const updateSiteConfig = async (updates) => {
  const rows = Object.entries(updates).map(([key, value]) => ({ key, value }));

  const { error } = await supabase
    .from('site_config')
    .upsert(rows, { onConflict: 'key' });

  if (error) throw error;
  return getSiteConfig();
};

module.exports = {
  getDashboard, getUsers, createUser, updateUser,
  toggleUser, getSiteConfig, updateSiteConfig
};