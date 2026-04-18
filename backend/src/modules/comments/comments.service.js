const supabase = require('../../config/supabase');

const getByArticle = async (article_id) => {
  const { data, error } = await supabase
    .from('article_comments')
    .select('id, author_name, content, created_at, parent_id')
    .eq('article_id', article_id)
    .eq('status', 'approved')
    .order('created_at', { ascending: true });

  if (error) throw error;

  // Organizar en árbol (comentarios y respuestas)
  const roots = data.filter(c => !c.parent_id);
  const replies = data.filter(c => c.parent_id);
  return roots.map(r => ({
    ...r,
    replies: replies.filter(rep => rep.parent_id === r.id)
  }));
};

const getAll = async ({ status } = {}) => {
  let query = supabase
    .from('article_comments')
    .select(`
      *,
      articles ( title, slug )
    `)
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

const create = async (body) => {
  const { article_id, parent_id, author_name, author_email, content } = body;

  if (!author_name || !content || content.trim().length < 2) {
    throw { status: 400, message: 'Nombre y comentario son requeridos' };
  }

  if (content.length > 1000) {
    throw { status: 400, message: 'El comentario no puede superar 1000 caracteres' };
  }

  const { data, error } = await supabase
    .from('article_comments')
    .insert({
      article_id,
      parent_id: parent_id || null,
      author_name,
      author_email: author_email || null,
      content: content.trim(),
      status: 'approved'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

const updateStatus = async (id, status) => {
  const { data, error } = await supabase
    .from('article_comments')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

const remove = async (id) => {
  const { error } = await supabase
    .from('article_comments')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

module.exports = { getByArticle, getAll, create, updateStatus, remove };