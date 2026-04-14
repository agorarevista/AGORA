import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getDashboard } from '../../api/admin.api';
import { formatDate } from '../../utils/formatDate';
import {
  FileText, Users, BookOpen, Send, Eye, TrendingUp,
  Plus, ChevronRight, AlertCircle
} from 'lucide-react';
import styles from './DashboardPage.module.css';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: 'easeOut', delay }
});

export default function DashboardPage() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashSkeleton />;
  if (!data)   return <div className={styles.error}>Error cargando dashboard</div>;

  const { articles, collaborators, editions, submissions } = data;

  const stats = [
    {
      label: 'Artículos publicados',
      value: articles.published,
      sub: `${articles.drafts} borradores`,
      icon: <FileText size={22} />,
      color: '#8B1A4A',
      link: '/admin/articulos'
    },
    {
      label: 'Vistas totales',
      value: articles.totalViews?.toLocaleString() || 0,
      sub: 'en todos los artículos',
      icon: <Eye size={22} />,
      color: '#1B4F8A',
      link: '/admin/analytics'
    },
    {
      label: 'Colaboradores',
      value: collaborators.total,
      sub: 'activos en la revista',
      icon: <Users size={22} />,
      color: '#2E6E3E',
      link: '/admin/colaboradores'
    },
    {
      label: 'Edición actual',
      value: editions.current ? `№ ${editions.current.number}` : '—',
      sub: editions.current?.name || 'Sin edición activa',
      icon: <BookOpen size={22} />,
      color: '#B8860B',
      link: '/admin/ediciones'
    },
    {
      label: 'Envíos pendientes',
      value: submissions.pending,
      sub: `${submissions.total} total recibidos`,
      icon: <Send size={22} />,
      color: submissions.pending > 0 ? '#CC3333' : '#2E6E3E',
      link: '/admin/convocatorias'
    },
    {
      label: 'Total ediciones',
      value: editions.total,
      sub: 'en el archivo histórico',
      icon: <TrendingUp size={22} />,
      color: '#5A2D82',
      link: '/admin/ediciones'
    },
  ];

  return (
    <div className={styles.page}>

      {/* ── Cabecera ──────────────────────────────────────── */}
      <motion.div {...fadeUp(0)} className={styles.header}>
        <div>
          <div className={styles.headerLabel}>Panel editorial</div>
          <h1 className={styles.headerTitle}>Dashboard</h1>
        </div>
        <Link to="/admin/articulos/nuevo" className={styles.newBtn}>
          <Plus size={16} />
          Nuevo artículo
        </Link>
      </motion.div>

      {/* ── Alerta si hay envíos pendientes ───────────────── */}
      {submissions.pending > 0 && (
        <motion.div {...fadeUp(0.05)} className={styles.alert}>
          <AlertCircle size={16} />
          <span>
            Tienes <strong>{submissions.pending}</strong> envío{submissions.pending !== 1 ? 's' : ''} pendiente{submissions.pending !== 1 ? 's' : ''} de revisar.
          </span>
          <Link to="/admin/convocatorias" className={styles.alertLink}>
            Revisar ahora →
          </Link>
        </motion.div>
      )}

      {/* ── Stats grid ────────────────────────────────────── */}
      <div className={styles.statsGrid}>
        {stats.map((s, i) => (
          <motion.div key={s.label} {...fadeUp(0.05 + i * 0.05)}>
            <Link to={s.link} className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: s.color + '18', color: s.color }}>
                {s.icon}
              </div>
              <div className={styles.statBody}>
                <div className={styles.statValue}>{s.value}</div>
                <div className={styles.statLabel}>{s.label}</div>
                <div className={styles.statSub}>{s.sub}</div>
              </div>
              <ChevronRight size={16} className={styles.statArrow} />
            </Link>
          </motion.div>
        ))}
      </div>

      {/* ── Accesos rápidos ───────────────────────────────── */}
      <motion.div {...fadeUp(0.3)} className={styles.quickSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Accesos rápidos</h2>
        </div>
        <div className={styles.quickGrid}>
          {[
            { label: 'Nuevo artículo',      icon: '✦', to: '/admin/articulos/nuevo',   desc: 'Crear y publicar contenido' },
            { label: 'Nueva edición',       icon: '◈', to: '/admin/ediciones',          desc: 'Gestionar números de la revista' },
            { label: 'Nuevo colaborador',   icon: '◍', to: '/admin/colaboradores',      desc: 'Agregar autor o escritor' },
            { label: 'Ver analítica',       icon: '◎', to: '/admin/analytics',          desc: 'Estadísticas de visitas' },
            { label: 'Moderar comentarios', icon: '◇', to: '/admin/comentarios',        desc: 'Aprobar o rechazar comentarios' },
            { label: 'Configuración',       icon: '⚙', to: '/admin/configuracion',     desc: 'Ajustes generales del sitio' },
          ].map((q, i) => (
            <motion.div key={q.label} {...fadeUp(0.35 + i * 0.04)}>
              <Link to={q.to} className={styles.quickCard}>
                <span className={styles.quickIcon}>{q.icon}</span>
                <div>
                  <div className={styles.quickLabel}>{q.label}</div>
                  <div className={styles.quickDesc}>{q.desc}</div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

    </div>
  );
}

function DashSkeleton() {
  return (
    <div style={{ padding: 32 }}>
      {[1,2,3].map(i => (
        <div key={i} style={{
          height: 80, marginBottom: 16, borderRadius: 8,
          background: 'linear-gradient(90deg, #f0ede8 25%, #e8e4dc 50%, #f0ede8 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite'
        }} />
      ))}
    </div>
  );
}