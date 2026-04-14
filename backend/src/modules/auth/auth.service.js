const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../../config/supabase');

const login = async (username, password) => {
  const { data: user, error } = await supabase
    .from('admin_users')
    .select('*')
    .eq('username', username)
    .eq('is_active', true)
    .single();

  if (error || !user) {
    throw { status: 401, message: 'Credenciales incorrectas' };
  }

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    throw { status: 401, message: 'Credenciales incorrectas' };
  }

  await supabase
    .from('admin_users')
    .update({ last_login: new Date().toISOString() })
    .eq('id', user.id);

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  return {
    token,
    user: {
      id: user.id,
      full_name: user.full_name,
      username: user.username,
      role: user.role,
      avatar_url: user.avatar_url,
      must_change_password: user.must_change_password
    }
  };
};

const changePassword = async (userId, currentPassword, newPassword) => {
  const { data: user } = await supabase
    .from('admin_users')
    .select('password_hash')
    .eq('id', userId)
    .single();

  const isValid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isValid) {
    throw { status: 400, message: 'Contraseña actual incorrecta' };
  }

  const newHash = await bcrypt.hash(newPassword, 12);

  await supabase
    .from('admin_users')
    .update({
      password_hash: newHash,
      must_change_password: false,
      temp_password: null
    })
    .eq('id', userId);
};

module.exports = { login, changePassword };