import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getAnalytics } from '../../api/analytics.api';
import { Link } from 'react-router-dom';
import { Eye, Users, TrendingUp, Share2 } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import styles from './AnalyticsPage.module.css';

const COLORS = ['#8B1A4A', '#1B4F8A', '#2E6E3E', '#B8860B', '#5A2D82', '#CC6633'];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: 'easeOut', delay }
});

export default function AnalyticsPage() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays]       = useState(30);

  useEffect(() => {
    setLoading(true);
    getAnalytics(days)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [days]);

  if (loading) return <AnalyticsSkeleton />;
  if (!data)   return <div className={styles.error}>Error cargando analítica</div>;

  const { totals, charts, top } = data;

  const summaryStats = [
    { label: 'Vistas totales',      value: totals.views?.toLocaleString() || 0,          icon: <Eye size={20} />,         color: '#8B1A4A' },
    { label: 'Visitantes únicos',   value: totals.unique_visitors?.toLocaleString() || 0, icon: <Users size={20} />,       color: '#1B4F8A' },
    { label: 'Artículos más visto', value: top.articles?.[0]?.title?.slice(0, 24) + '…' || '—', icon: <TrendingUp size={20} />, color: '#2E6E3E' },
    { label: 'Total compartidos',   value: top.shared?.reduce((a,s) => a + s.total, 0) || 0, icon: <Share2 size={20} />,  color: '#B8860B' },
  ];

  return (
    <div className={styles.page}>

      {/* ── Header ────────────────────────────────────────── */}
      <motion.div {...fadeUp(0)} className={styles.header}>
        <div>
          <div className={styles.headerLabel}>Estadísticas</div>
          <h1 className={styles.headerTitle}>Analítica editorial</h1>
        </div>
        <div className={styles.periodSelector}>
          {[7, 14, 30, 90].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`${styles.periodBtn} ${days === d ? styles.periodActive : ''}`}
            >
              {d} días
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── Summary stats ─────────────────────────────────── */}
      <div className={styles.summaryGrid}>
        {summaryStats.map((s, i) => (
          <motion.div key={s.label} {...fadeUp(0.05 + i * 0.05)} className={styles.summaryCard}>
            <div className={styles.summaryIcon} style={{ color: s.color, background: s.color + '18' }}>
              {s.icon}
            </div>
            <div>
              <div className={styles.summaryValue}>{s.value}</div>
              <div className={styles.summaryLabel}>{s.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Gráfica de vistas por día ──────────────────────── */}
      {charts.viewsByDay?.length > 0 && (
        <motion.div {...fadeUp(0.2)} className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h2 className={styles.chartTitle}>Vistas por día</h2>
            <span className={styles.chartSub}>Últimos {days} días</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={charts.viewsByDay} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fontFamily: 'Arial' }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fontFamily: 'Arial' }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ fontFamily: 'Arial', fontSize: 12, border: '1px solid #e8e4dc', borderRadius: 4 }}
              />
              <Legend wrapperStyle={{ fontFamily: 'Arial', fontSize: 12 }} />
              <Line type="monotone" dataKey="views"  stroke="#8B1A4A" strokeWidth={2} dot={false} name="Vistas" />
              <Line type="monotone" dataKey="unique" stroke="#1B4F8A" strokeWidth={2} dot={false} name="Únicos" strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* ── Gráficas secundarias ───────────────────────────── */}
      <div className={styles.chartsRow}>
        {/* Por categoría */}
        {charts.byCategory?.length > 0 && (
          <motion.div {...fadeUp(0.25)} className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <h2 className={styles.chartTitle}>Vistas por sección</h2>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={charts.byCategory.slice(0, 8)} layout="vertical" margin={{ left: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fontFamily: 'Arial' }} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fontFamily: 'Arial' }} tickLine={false} width={100} />
                <Tooltip contentStyle={{ fontFamily: 'Arial', fontSize: 12, border: '1px solid #e8e4dc', borderRadius: 4 }} />
                <Bar dataKey="views" fill="#8B1A4A" radius={[0, 3, 3, 0]} name="Vistas" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Por dispositivo */}
        {charts.byDevice?.length > 0 && (
          <motion.div {...fadeUp(0.3)} className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <h2 className={styles.chartTitle}>Dispositivos</h2>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={charts.byDevice}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {charts.byDevice.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontFamily: 'Arial', fontSize: 12, border: '1px solid #e8e4dc', borderRadius: 4 }} />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </div>

      {/* ── Top artículos ─────────────────────────────────── */}
      {top.articles?.length > 0 && (
        <motion.div {...fadeUp(0.35)} className={styles.tableCard}>
          <div className={styles.chartHeader}>
            <h2 className={styles.chartTitle}>Artículos más leídos</h2>
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Artículo</th>
                <th>Autor</th>
                <th>Vistas</th>
              </tr>
            </thead>
            <tbody>
              {top.articles.map((art, i) => (
                <tr key={art.id}>
                  <td className={styles.tdNum}>{i + 1}</td>
                  <td>
                    <Link to={`/articulos/${art.slug}`} target="_blank" className={styles.artLink}>
                      {art.title}
                    </Link>
                  </td>
                  <td className={styles.tdMuted}>{art.collaborators?.name || '—'}</td>
                  <td className={styles.tdViews}>
                    <Eye size={12} /> {art.views?.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}

      {/* ── Top compartidos ───────────────────────────────── */}
      {top.liked?.length > 0 && (
        <motion.div {...fadeUp(0.4)} className={styles.tableCard}>
          <div className={styles.chartHeader}>
            <h2 className={styles.chartTitle}>Artículos más gustados</h2>
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Artículo</th>
                <th>❤ Likes</th>
              </tr>
            </thead>
            <tbody>
              {top.liked.map((item, i) => (
                <tr key={i}>
                  <td className={styles.tdNum}>{i + 1}</td>
                  <td>
                    <Link to={`/articulos/${item.article?.slug}`} target="_blank" className={styles.artLink}>
                      {item.article?.title || '—'}
                    </Link>
                  </td>
                  <td className={styles.tdViews}>♥ {item.likes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}

    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div style={{ padding: 32 }}>
      {[80, 260, 220].map((h, i) => (
        <div key={i} style={{
          height: h, marginBottom: 20, borderRadius: 8,
          background: 'linear-gradient(90deg, #f7f5f1 25%, #e8e4dc 50%, #f7f5f1 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite'
        }} />
      ))}
    </div>
  );
}