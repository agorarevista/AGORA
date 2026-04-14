require('dotenv').config();
const bcrypt = require('bcryptjs');
const supabase = require('../src/config/supabase');

async function createSuperAdmin() {
  const password = 'Admin@Agora2026!';
  const hash = await bcrypt.hash(password, 12);

  const { data, error } = await supabase
    .from('admin_users')
    .insert({
      full_name: 'Super Administrador',
      username: 'superadmin',
      password_hash: hash,
      role: 'superadmin',
      must_change_password: true
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  console.log('✅ Superadmin creado:');
  console.log('   Usuario:    superadmin');
  console.log('   Contraseña: Admin@Agora2026!');
  console.log('   ⚠️  Cámbiala en el primer login!');
}

createSuperAdmin();