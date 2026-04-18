import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getSiteConfig, updateSiteConfig } from '../../api/admin.api';
import useAlert from '../../hooks/useAlert';
import { Save, Globe, Mail, Share2, FileText } from 'lucide-react';
import styles from './SettingsPage.module.css';

const EMPTY = {
  site_name: 'Agorá Revista',
  site_description: '',
  contact_email: '',
  substack_url: '',
  instagram_url: '',
  facebook_url: '',
  twitter_url: '',
  whatsapp_number: '',
  articles_per_page: 12,
  enable_comments: true,
  enable_likes: true,
  enable_shares: true,
  maintenance_mode: false,
};

export default function SettingsPage() {
  const alert = useAlert();
  const [config, setConfig] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    getSiteConfig()
      .then(data => setConfig(prev => ({ ...prev, ...data })))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const set = (key, val) => setConfig(c => ({ ...c, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSiteConfig(config);
      alert.success('Guardado', 'Configuración actualizada correctamente');
    } catch {
      alert.error('Error', 'No se pudo guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className={styles.loading}>Cargando configuración...</div>;

  return (
    <div className={styles.page}>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className={styles.header}
      >
        <div>
          <div className={styles.headerLabel}>Sistema</div>
          <h1 className={styles.headerTitle}>Configuración del sitio</h1>
        </div>
        <button onClick={handleSave} disabled={saving} className={styles.saveBtn}>
          <Save size={15} />
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </motion.div>

      <div className={styles.sections}>

        {/* General */}
        <Section icon={<Globe size={16} />} title="Información general">
          <div className={styles.formGrid}>
            <FormGroup label="Nombre del sitio">
              <input
                type="text"
                value={config.site_name}
                onChange={e => set('site_name', e.target.value)}
                className={styles.input}
                placeholder="Agorá Revista"
              />
            </FormGroup>
            <FormGroup label="Email de contacto">
              <input
                type="email"
                value={config.contact_email}
                onChange={e => set('contact_email', e.target.value)}
                className={styles.input}
                placeholder="contacto@agorarevista.com"
              />
            </FormGroup>
            <FormGroup label="Descripción del sitio" full>
              <textarea
                value={config.site_description}
                onChange={e => set('site_description', e.target.value)}
                className={styles.textarea}
                rows={3}
                placeholder="Revista digital de cultura y arte desde el noroeste de México..."
              />
            </FormGroup>
          </div>
        </Section>

        {/* Redes sociales */}
        <Section icon={<Share2 size={16} />} title="Redes sociales y newsletter">
          <div className={styles.formGrid}>
            <FormGroup label="Substack URL">
              <input
                type="url"
                value={config.substack_url}
                onChange={e => set('substack_url', e.target.value)}
                className={styles.input}
                placeholder="https://agorarevista.substack.com"
              />
            </FormGroup>
            <FormGroup label="Instagram URL">
              <input
                type="url"
                value={config.instagram_url}
                onChange={e => set('instagram_url', e.target.value)}
                className={styles.input}
                placeholder="https://instagram.com/agorarevista"
              />
            </FormGroup>
            <FormGroup label="Facebook URL">
              <input
                type="url"
                value={config.facebook_url}
                onChange={e => set('facebook_url', e.target.value)}
                className={styles.input}
                placeholder="https://facebook.com/agorarevista"
              />
            </FormGroup>
            <FormGroup label="Twitter / X URL">
              <input
                type="url"
                value={config.twitter_url}
                onChange={e => set('twitter_url', e.target.value)}
                className={styles.input}
                placeholder="https://x.com/agorarevista"
              />
            </FormGroup>
            <FormGroup label="WhatsApp (número con código de país)">
              <input
                type="text"
                value={config.whatsapp_number}
                onChange={e => set('whatsapp_number', e.target.value)}
                className={styles.input}
                placeholder="+526681234567"
              />
            </FormGroup>
          </div>
        </Section>

        {/* Artículos */}
        <Section icon={<FileText size={16} />} title="Comportamiento del sitio">
          <div className={styles.formGrid}>
            <FormGroup label="Artículos por página">
              <input
                type="number"
                value={config.articles_per_page}
                onChange={e => set('articles_per_page', parseInt(e.target.value) || 12)}
                className={styles.input}
                min={4}
                max={48}
              />
            </FormGroup>
          </div>

          <div className={styles.toggleList}>
            <Toggle
              label="Comentarios habilitados"
              desc="Los lectores pueden comentar en los artículos"
              checked={config.enable_comments}
              onChange={v => set('enable_comments', v)}
            />
            <Toggle
              label="Likes habilitados"
              desc="Los lectores pueden dar like a los artículos"
              checked={config.enable_likes}
              onChange={v => set('enable_likes', v)}
            />
            <Toggle
              label="Compartir habilitado"
              desc="Los lectores pueden compartir artículos en redes"
              checked={config.enable_shares}
              onChange={v => set('enable_shares', v)}
            />
          </div>
        </Section>

        {/* Mantenimiento */}
        <Section icon={<Mail size={16} />} title="Estado del sitio">
          <div className={styles.toggleList}>
            <Toggle
              label="Modo mantenimiento"
              desc="El sitio mostrará una página de mantenimiento a los visitantes"
              checked={config.maintenance_mode}
              onChange={v => set('maintenance_mode', v)}
              danger
            />
          </div>

          {config.maintenance_mode && (
            <div className={styles.warningBox}>
              ⚠️ El modo mantenimiento está activado. Los visitantes no pueden ver el sitio.
            </div>
          )}
        </Section>

      </div>

      {/* Guardar flotante */}
      <div className={styles.stickyBar}>
        <span className={styles.stickyText}>Tienes cambios sin guardar</span>
        <button onClick={handleSave} disabled={saving} className={styles.saveBtn}>
          <Save size={15} />
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>

    </div>
  );
}

function Section({ icon, title, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={styles.section}
    >
      <div className={styles.sectionHeader}>
        <span className={styles.sectionIcon}>{icon}</span>
        <h2 className={styles.sectionTitle}>{title}</h2>
      </div>
      <div className={styles.sectionBody}>{children}</div>
    </motion.div>
  );
}

function FormGroup({ label, full, children }) {
  return (
    <div className={`${styles.formGroup} ${full ? styles.formGroupFull : ''}`}>
      <label className={styles.label}>{label}</label>
      {children}
    </div>
  );
}

function Toggle({ label, desc, checked, onChange, danger = false }) {
  return (
    <div className={`${styles.toggleRow} ${danger ? styles.toggleDanger : ''}`}>
      <div className={styles.toggleInfo}>
        <div className={styles.toggleLabel}>{label}</div>
        {desc && <div className={styles.toggleDesc}>{desc}</div>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`${styles.toggle} ${checked ? styles.toggleOn : ''} ${danger && checked ? styles.toggleOnDanger : ''}`}
      >
        <span className={styles.toggleThumb} />
      </button>
    </div>
  );
}