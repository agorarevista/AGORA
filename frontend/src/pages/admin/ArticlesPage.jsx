import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getArticles } from '../../api/articles.api';
import { publishArticle, deleteArticle } from '../../api/articles.api';
import { formatDate } from '../../utils/formatDate';
import useAlert from '../../hooks/useAlert';
import {
  Plus, Search, Eye, Edit, Trash2, Send,
  FileText, Filter, ChevronDown
} from 'lucide-react';
import styles from './ArticlesPage.module.css';

const STATUS_LABELS = {
  draft:     { label: 'Borrador',  color: '#92400E', bg: '#FEF3C7' },
  published: { label: 'Publicado', color: '#065F46', bg: '#D1FAE5' },
  archived:  { label: 'Archivado', color: '#6B7280', bg: '#F3F4F6' },
};

export default function ArticlesPage() {
  const navigate = useNavigate();
  const alert    = useAlert();

  const [articles, setArticles]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage]           = useState(1);
  const [total, setTotal]         = useState(0);
  const LIMIT = 15;

  const load = async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (statusFilter !== 'all') params.status = statusFilter;

      const res = await getArticles(params);
      setArticles(res.data || []);
      setTotal(res.total || 0);
    } catch {
      alert.error('Error', 'No se pudieron cargar los artículos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page, statusFilter]);

  // Filtro local por búsqueda
  const filtered = articles.filter(a =>
    a.title?.toLowerCase().includes(search.toLowerCase()) ||
    a.collaborators?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handlePublish = async (id) => {
    if (!window.confirm('¿Publicar este artículo?')) return;
    try {
      await publishArticle(id);
      alert.success('Publicado', 'El artículo ya está visible');
      load();
    } catch {
      alert.error('Error', 'No se pudo publicar');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Archivar este artículo? No se eliminará permanentemente.')) return;
    try {
      await deleteArticle(id);
      alert.success('Archivado', 'El artículo fue archivado');
      load();
    } catch {
      alert.error('Error', 'No se pudo archivar');
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className={styles.page}>

      {/* ── Header ────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className={styles.header}
      >
        <div>
          <div className={styles.headerLabel}>Contenido</div>
          <h1 className={styles.headerTitle}>Artículos</h1>
        </div>
        <Link to="/admin/articulos/nuevo" className={styles.newBtn}>
          <Plus size={16} />
          Nuevo artículo
        </Link>
      </motion.div>

      {/* ── Filtros ───────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className={styles.filters}
      >
        {/* Búsqueda */}
        <div className={styles.searchWrap}>
          <Search size={15} className={styles.searchIcon} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por título o autor..."
            className={styles.searchInput}
          />
        </div>

        {/* Filtro de estado */}
        <div className={styles.filterWrap}>
          <Filter size={14} />
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className={styles.filterSelect}
          >
            <option value="all">Todos los estados</option>
            <option value="draft">Borradores</option>
            <option value="published">Publicados</option>
            <option value="archived">Archivados</option>
          </select>
          <ChevronDown size={13} />
        </div>

        <div className={styles.totalCount}>
          {total} artículo{total !== 1 ? 's' : ''}
        </div>
      </motion.div>

      {/* ── Tabla ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className={styles.tableWrap}
      >
        {loading ? (
          <TableSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState search={search} />
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Artículo</th>
                <th>Autor</th>
                <th>Secciones</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Vistas</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(art => {
                const s = STATUS_LABELS[art.status] || STATUS_LABELS.draft;
                const cats = art.article_categories?.map(ac => ac.categories?.name).filter(Boolean) || [];

                return (
                  <tr key={art.id}>
                    {/* Artículo */}
                    <td className={styles.tdArticle}>
                      <div className={styles.articleInfo}>
                        {art.cover_image_url ? (
                          <img src={art.cover_image_url} alt="" className={styles.articleThumb} />
                        ) : (
                          <div className={styles.articleThumbEmpty}>
                            <FileText size={14} />
                          </div>
                        )}
                        <div>
                          <div className={styles.articleTitle}>{art.title}</div>
                          {art.subtitle && (
                            <div className={styles.articleSubtitle}>{art.subtitle}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Autor */}
                    <td className={styles.tdMuted}>
                      {art.collaborators?.name || '—'}
                    </td>

                    {/* Secciones */}
                    <td>
                      <div className={styles.catTags}>
                        {cats.slice(0, 2).map(c => (
                          <span key={c} className={styles.catTag}>{c}</span>
                        ))}
                        {cats.length > 2 && (
                          <span className={styles.catTagMore}>+{cats.length - 2}</span>
                        )}
                      </div>
                    </td>

                    {/* Estado */}
                    <td>
                      <span
                        className={styles.statusBadge}
                        style={{ background: s.bg, color: s.color }}
                      >
                        {s.label}
                      </span>
                    </td>

                    {/* Fecha */}
                    <td className={styles.tdMuted}>
                      {art.published_at
                        ? formatDate(art.published_at)
                        : formatDate(art.created_at)
                      }
                    </td>

                    {/* Vistas */}
                    <td className={styles.tdViews}>
                      <div className={styles.viewsInline}>
                        <Eye size={12} />
                        <span>{art.views || 0}</span>
                      </div>
                    </td>

                    {/* Acciones */}
                    <td>
                      <div className={styles.actions}>
                        {/* Ver en sitio */}
                        {art.status === 'published' && (
                          <a
                            href={`/articulos/${art.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.actionBtn}
                            title="Ver en sitio"
                          >
                            <Eye size={14} />
                          </a>
                        )}

                        {/* Editar */}
                        <button
                          onClick={() => navigate(`/admin/articulos/editar/${art.id}`)}
                          className={styles.actionBtn}
                          title="Editar"
                        >
                          <Edit size={14} />
                        </button>

                        {/* Publicar (solo borradores) */}
                        {art.status === 'draft' && (
                          <button
                            onClick={() => handlePublish(art.id)}
                            className={`${styles.actionBtn} ${styles.actionPublish}`}
                            title="Publicar"
                          >
                            <Send size={14} />
                          </button>
                        )}

                        {/* Archivar */}
                        {art.status !== 'archived' && (
                          <button
                            onClick={() => handleDelete(art.id)}
                            className={`${styles.actionBtn} ${styles.actionDelete}`}
                            title="Archivar"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </motion.div>

      {/* ── Paginación ────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className={styles.pageBtn}
          >
            ← Anterior
          </button>
          <span className={styles.pageInfo}>
            Página {page} de {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className={styles.pageBtn}
          >
            Siguiente →
          </button>
        </div>
      )}

    </div>
  );
}

function TableSkeleton() {
  return (
    <div className={styles.skeleton}>
      {[1,2,3,4,5].map(i => (
        <div key={i} className={styles.skeletonRow} />
      ))}
    </div>
  );
}

function EmptyState({ search }) {
  return (
    <div className={styles.empty}>
      <span className={styles.emptyIcon}>✦</span>
      <h3>
        {search
          ? `Sin resultados para "${search}"`
          : 'No hay artículos todavía'
        }
      </h3>
      <p>
        {search
          ? 'Intenta con otro término de búsqueda'
          : 'Crea el primer artículo de la revista'
        }
      </p>
      {!search && (
        <Link to="/admin/articulos/nuevo" className={styles.emptyBtn}>
          <Plus size={14} /> Nuevo artículo
        </Link>
      )}
    </div>
  );
}