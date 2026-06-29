import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getConvocatorias } from '../../api/convocatorias.api';
import { formatDate } from '../../utils/formatDate';
import { Search, Calendar, Users, FileText, Filter, X } from 'lucide-react';
import styles from './ConvocatoriasListPage.module.css';

const STATUS_OPTIONS = [
  { value: 'all',    label: 'Todas' },
  { value: 'open',   label: 'Abiertas' },
  { value: 'closed', label: 'Cerradas' },
];

export default function ConvocatoriasListPage() {
  const [convs, setConvs]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [status, setStatus]     = useState('open');
  const [category, setCategory] = useState('all');

  useEffect(() => {
    getConvocatorias()
      .then(setConvs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();

  // Todas las categorías únicas
  const allCategories = useMemo(() => {
    const cats = new Set();
    convs.forEach(c => c.categories?.forEach(cat => cats.add(cat)));
    return ['all', ...Array.from(cats)];
  }, [convs]);

  // Filtros
  const filtered = useMemo(() => {
    return convs.filter(c => {
      const deadline  = c.closes_at ? new Date(c.closes_at) : null;
      const isPast    = deadline && deadline < now;
      const isOpen    = c.is_active && !isPast;

      if (status === 'open'   && !isOpen)  return false;
      if (status === 'closed' && isOpen)   return false;

      if (category !== 'all' && !c.categories?.includes(category)) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        if (!c.title?.toLowerCase().includes(q) &&
            !c.subtitle?.toLowerCase().includes(q) &&
            !c.description?.toLowerCase().includes(q)) return false;
      }

      return true;
    });
  }, [convs, status, category, search]);

  const openCount   = convs.filter(c => {
    const d = c.closes_at ? new Date(c.closes_at) : null;
    return c.is_active && (!d || d > now);
  }).length;

  return (
    <div className={styles.page}>

      {/* ── Hero ─────────────────────────────────────────── */}
      <div className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroLabel}>Participa</div>
          <h1 className={styles.heroTitle}>Convocatorias</h1>
          <p className={styles.heroDesc}>
            Agorá Revista abre sus puertas a escritores, artistas y creadores.
            Envía tu propuesta y forma parte de nuestra comunidad editorial.
          </p>
          {openCount > 0 && (
            <div className={styles.heroBadge}>
              ● {openCount} convocatoria{openCount !== 1 ? 's' : ''} abierta{openCount !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      <div className={styles.meander} />

      {/* ── Filtros ──────────────────────────────────────── */}
      <div className={styles.filtersBar}>
        <div className={styles.filtersInner}>

          {/* Búsqueda */}
          <div className={styles.searchWrap}>
            <Search size={15} className={styles.searchIcon} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar convocatoria..."
              className={styles.searchInput}
            />
            {search && (
              <button className={styles.clearSearch} onClick={() => setSearch('')}>
                <X size={14} />
              </button>
            )}
          </div>

          {/* Estado */}
          <div className={styles.filterGroup}>
            <Filter size={13} className={styles.filterIcon} />
            <div className={styles.statusTabs}>
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setStatus(opt.value)}
                  className={`${styles.statusTab} ${status === opt.value ? styles.statusTabActive : ''}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Categoría */}
          {allCategories.length > 1 && (
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className={styles.catSelect}
            >
              <option value="all">Todas las categorías</option>
              {allCategories.filter(c => c !== 'all').map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}

          {/* Contador */}
          <div className={styles.resultCount}>
            {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* ── Lista ────────────────────────────────────────── */}
      <div className={styles.body}>
        {loading ? (
          <GridSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState status={status} search={search} onClear={() => { setSearch(''); setStatus('all'); setCategory('all'); }} />
        ) : (
          <div className={styles.grid}>
            {filtered.map((conv, i) => (
              <motion.div
                key={conv.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 6) * 0.06 }}
              >
                <ConvCard conv={conv} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Card de convocatoria ─────────────────────────────── */
function ConvCard({ conv: c }) {
  const now      = new Date();
  const deadline = c.closes_at ? new Date(c.closes_at) : null;
  const isPast   = deadline && deadline < now;
  const isOpen   = c.is_active && !isPast;
  const daysLeft = deadline && !isPast
    ? Math.ceil((deadline - now) / (1000*60*60*24)) : null;

  return (
    <Link to={`/convocatoria/${c.id}`} className={`${styles.card} ${!isOpen ? styles.cardClosed : ''}`}>

      {/* Imagen */}
      <div className={styles.cardImg}>
        {c.cover_image_url
          ? <img src={c.cover_image_url} alt={c.title} />
          : <div className={styles.cardImgPlaceholder}><span>◈</span></div>
        }
        {/* Badge de estado superpuesto */}
        <div className={`${styles.cardBadge} ${isOpen ? styles.cardBadgeOpen : styles.cardBadgeClosed}`}>
          {isOpen ? '● Abierta' : '○ Cerrada'}
        </div>
      </div>

{/* Cuerpo */}
<div className={styles.cardBody}>

  <h3 className={styles.cardTitle}>{c.title}</h3>

  {c.subtitle && (
    <p className={styles.cardSubtitle}>{c.subtitle}</p>
  )}

  {c.description && (
    <p className={styles.cardDesc}>{c.description}</p>
  )}

  {/* Meta */}
  <div className={styles.cardMeta}>
    {deadline && (
      <span className={`${styles.metaItem} ${isPast ? styles.metaItemDead : isOpen ? styles.metaItemOpen : ''}`}>
        <Calendar size={12} />
        {isPast
          ? `Cerró: ${formatDate(c.closes_at)}`
          : daysLeft <= 7
            ? `${daysLeft} día${daysLeft !== 1 ? 's' : ''} restante${daysLeft !== 1 ? 's' : ''}`
            : `Hasta: ${formatDate(c.closes_at)}`
        }
      </span>
    )}
    {c.max_submissions && (
      <span className={styles.metaItem}>
        <Users size={12} />
        Cupo: {c.max_submissions}
      </span>
    )}
  </div>

  {/* Categorías */}
  {c.categories?.length > 0 && (
    <div className={styles.cardCats}>
      {c.categories.slice(0, 4).map(cat => (
        <span key={cat} className={styles.cardCat}>
          <span className={styles.cardCatDot} />
          {cat}
        </span>
      ))}

      {c.categories.length > 4 && (
        <span className={styles.cardCatMore}>
          +{c.categories.length - 4}
        </span>
      )}
    </div>
  )}

  {/* CTA */}
  <div className={styles.cardCta}>
    {isOpen ? 'Ver convocatoria y participar →' : 'Ver detalles →'}
  </div>
</div>
    </Link>
  );
}

function GridSkeleton() {
  return (
    <div className={styles.grid}>
      {[1,2,3,4].map(i => <div key={i} className={styles.skeletonCard} />)}
    </div>
  );
}

function EmptyState({ status, search, onClear }) {
  return (
    <div className={styles.empty}>
      <span className={styles.emptySymbol}>◈</span>
      <h3>
        {search
          ? `Sin resultados para "${search}"`
          : status === 'open'
            ? 'No hay convocatorias abiertas en este momento'
            : 'No hay convocatorias con estos filtros'
        }
      </h3>
      <p>Mantente atento a nuevas convocatorias editoriales.</p>
      <button onClick={onClear} className={styles.clearBtn}>
        Limpiar filtros
      </button>
    </div>
  );
}