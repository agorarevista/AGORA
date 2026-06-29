import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getSubmissions, updateSubmission, deleteSubmission } from '../../api/submissions.api';
import { getConvocatoria } from '../../api/convocatorias.api';
import useAlert   from '../../hooks/useAlert';
import useConfirm from '../../hooks/useConfirm';
import { formatDate } from '../../utils/formatDate';
import {
  ArrowLeft, Eye, Check, X, Trash2, Mail,
  Calendar, FileText, User, ExternalLink, Download
} from 'lucide-react';
import styles from './SubmissionsPage.module.css';

const STATUS_TABS = [
  { value: 'all',      label: 'Todos' },
  { value: 'pending',  label: 'Pendientes' },
  { value: 'accepted', label: 'Aceptados' },
  { value: 'rejected', label: 'Rechazados' },
];

export default function SubmissionsPage() {
  const { id: convId }      = useParams();
  const alert               = useAlert();
  const confirm             = useConfirm();
  const [conv, setConv]     = useState(null);
  const [subs, setSubs]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState('all');
  const [selected, setSelected] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [convData, subsData] = await Promise.all([
        getConvocatoria(convId),
        getSubmissions({ convocatoria_id: convId }),
      ]);
      setConv(convData);
      setSubs(Array.isArray(subsData) ? subsData : subsData?.data || []);
    } catch {
      alert.error('Error', 'No se pudieron cargar los envíos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [convId]);

  const handleStatus = async (sub, status) => {
    try {
      await updateSubmission(sub.id, { status });
      alert.success(
        status === 'accepted' ? 'Aceptado' : 'Rechazado',
        `Envío de ${sub.author_name} actualizado`
      );
      setSubs(prev => prev.map(s => s.id === sub.id ? { ...s, status } : s));
      if (selected?.id === sub.id) setSelected(s => ({ ...s, status }));
    } catch { alert.error('Error', 'No se pudo actualizar'); }
  };

const handleDelete = async (sub) => {
  const ok = await confirm({
    type: 'error',
    title: '¿Eliminar este envío?',
    message: `Se eliminará el envío de "${sub.author_name}" permanentemente.`,
    confirmLabel: 'Sí, eliminar',
  });
  if (!ok) return;
    try {
      await deleteSubmission(sub.id);
      alert.success('Eliminado', 'Envío eliminado');
      setSubs(prev => prev.filter(s => s.id !== sub.id));
      if (selected?.id === sub.id) setSelected(null);
    } catch { alert.error('Error', 'No se pudo eliminar'); }
  };

  const filtered = subs.filter(s => tab === 'all' || s.status === tab);

  const counts = {
    all:      subs.length,
    pending:  subs.filter(s => s.status === 'pending').length,
    accepted: subs.filter(s => s.status === 'accepted').length,
    rejected: subs.filter(s => s.status === 'rejected').length,
  };

  return (
    <div className={styles.page}>

      {/* ── Header ──────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className={styles.header}>
        <div className={styles.headerLeft}>
          <Link to="/admin/convocatorias" className={styles.back}>
            <ArrowLeft size={14} /> Convocatorias
          </Link>
          <div className={styles.headerLabel}>Envíos recibidos</div>
          <h1 className={styles.headerTitle}>
            {conv?.title || 'Cargando...'}
          </h1>
        </div>
        <div className={styles.headerStats}>
          <div className={styles.statBox}>
            <span className={styles.statNum}>{counts.pending}</span>
            <span className={styles.statLabel}>Pendientes</span>
          </div>
          <div className={styles.statBox}>
            <span className={`${styles.statNum} ${styles.statAccepted}`}>{counts.accepted}</span>
            <span className={styles.statLabel}>Aceptados</span>
          </div>
          <div className={styles.statBox}>
            <span className={`${styles.statNum} ${styles.statRejected}`}>{counts.rejected}</span>
            <span className={styles.statLabel}>Rechazados</span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statNum}>{counts.all}</span>
            <span className={styles.statLabel}>Total</span>
          </div>
        </div>
      </motion.div>

      {/* ── Tabs ────────────────────────────────────────── */}
      <div className={styles.tabs}>
        {STATUS_TABS.map(t => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`${styles.tab} ${tab === t.value ? styles.tabActive : ''}`}
          >
            {t.label}
            {counts[t.value] > 0 && (
              <span className={`${styles.tabCount} ${tab === t.value ? styles.tabCountActive : ''}`}>
                {counts[t.value]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Layout: lista + detalle ──────────────────────── */}
      <div className={styles.layout}>

        {/* Lista */}
        <div className={styles.listCol}>
          {loading ? (
            <SkeletonList />
          ) : filtered.length === 0 ? (
            <EmptyState tab={tab} />
          ) : (
            <div className={styles.list}>
              {filtered.map((sub, i) => (
                <motion.div
                  key={sub.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <SubRow
                    sub={sub}
                    selected={selected?.id === sub.id}
                    onClick={() => setSelected(sub)}
                    onAccept={() => handleStatus(sub, 'accepted')}
                    onReject={() => handleStatus(sub, 'rejected')}
                    onDelete={() => handleDelete(sub)}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Detalle */}
        <div className={styles.detailCol}>
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.2 }}
                className={styles.detailPanel}
              >
                <SubDetail
                  sub={selected}
                  onAccept={() => handleStatus(selected, 'accepted')}
                  onReject={() => handleStatus(selected, 'rejected')}
                  onDelete={() => handleDelete(selected)}
                  onClose={() => setSelected(null)}
                />
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={styles.detailEmpty}
              >
                <FileText size={32} className={styles.detailEmptyIcon} />
                <p>Selecciona un envío para ver el detalle</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ── Fila de envío ─────────────────────────────────────── */
function SubRow({ sub, selected, onClick, onAccept, onReject, onDelete }) {
  return (
    <div
      className={`${styles.subRow} ${selected ? styles.subRowSelected : ''} ${styles[`subRow_${sub.status}`]}`}
      onClick={onClick}
    >
      <div className={styles.subRowTop}>
        <div className={styles.subAvatar}>
          {(sub.author_name || '?')[0].toUpperCase()}
        </div>
        <div className={styles.subInfo}>
          <div className={styles.subName}>{sub.author_name}</div>
          <div className={styles.subEmail}>{sub.author_email}</div>
        </div>
        <StatusBadge status={sub.status} />
      </div>

      {sub.title && (
        <div className={styles.subTitle}>{sub.title}</div>
      )}

      <div className={styles.subMeta}>
        <span><Calendar size={11} />{formatDate(sub.created_at)}</span>
        {sub.category && <span><FileText size={11} />{sub.category}</span>}
      </div>

      <div className={styles.subActions} onClick={e => e.stopPropagation()}>
        {sub.status !== 'accepted' && (
          <button className={`${styles.actionBtn} ${styles.actionAccept}`} onClick={onAccept} title="Aceptar">
            <Check size={13} />
          </button>
        )}
        {sub.status !== 'rejected' && (
          <button className={`${styles.actionBtn} ${styles.actionReject}`} onClick={onReject} title="Rechazar">
            <X size={13} />
          </button>
        )}
        <button className={`${styles.actionBtn} ${styles.actionDelete}`} onClick={onDelete} title="Eliminar">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

/* ── Panel de detalle ──────────────────────────────────── */
function SubDetail({ sub, onAccept, onReject, onDelete, onClose }) {
  const [showContent, setShowContent] = useState(false);

  return (
    <div className={styles.detail}>

      {/* Header del detalle */}
      <div className={styles.detailHeader}>
        <div className={styles.detailHeaderLeft}>
          <StatusBadge status={sub.status} />
          <span className={styles.detailDate}>{formatDate(sub.created_at)}</span>
        </div>
        <button className={styles.detailClose} onClick={onClose}><X size={16} /></button>
      </div>

      {/* Autor */}
      <div className={styles.detailAuthor}>
        <div className={styles.detailAvatar}>
          {(sub.author_name || '?')[0].toUpperCase()}
        </div>
        <div>
          <div className={styles.detailAuthorName}>{sub.author_name}</div>
          <a href={`mailto:${sub.author_email}`} className={styles.detailAuthorEmail}>
            <Mail size={12} /> {sub.author_email}
          </a>
        </div>
      </div>

      {/* Título de la obra */}
      {sub.title && (
        <div className={styles.detailSection}>
          <div className={styles.detailSectionLabel}>Título</div>
          <div className={styles.detailSectionValue}>{sub.title}</div>
        </div>
      )}

      {/* Categoría */}
      {sub.category && (
        <div className={styles.detailSection}>
          <div className={styles.detailSectionLabel}>Categoría</div>
          <div className={styles.detailSectionValue}>{sub.category}</div>
        </div>
      )}

      {/* Extracto */}
      {sub.excerpt && (
        <div className={styles.detailSection}>
          <div className={styles.detailSectionLabel}>Extracto / sinopsis</div>
          <div className={styles.detailExcerpt}>{sub.excerpt}</div>
        </div>
      )}

      {/* Texto completo */}
      {sub.content && (
        <div className={styles.detailSection}>
          <div className={styles.detailSectionLabel}>
            Texto completo
            <button
              className={styles.toggleContent}
              onClick={() => setShowContent(s => !s)}
            >
              <Eye size={12} /> {showContent ? 'Ocultar' : 'Ver texto'}
            </button>
          </div>
          <AnimatePresence>
            {showContent && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={styles.detailContent}
              >
                {sub.content}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

{/* URL de archivo */}
{sub.file_url && (
  <div className={styles.detailSection}>
    <div className={styles.detailSectionLabel}>Archivo adjunto</div>

    <a
      href={sub.file_url}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.fileLink}
    >
      <ExternalLink size={13} /> Ver archivo externo
    </a>
  </div>
)}s

      {/* Notas */}
      {sub.notes && (
        <div className={styles.detailSection}>
          <div className={styles.detailSectionLabel}>Notas del autor</div>
          <div className={styles.detailNotes}>{sub.notes}</div>
        </div>
      )}

      {/* Acciones */}
      <div className={styles.detailActions}>
        <a href={`mailto:${sub.author_email}?subject=Re: ${sub.title || 'Tu envío a Agorá'}`} className={styles.detailBtnEmail}>
          <Mail size={14} /> Responder por email
        </a>
        {sub.status !== 'accepted' && (
          <button className={styles.detailBtnAccept} onClick={onAccept}>
            <Check size={14} /> Aceptar
          </button>
        )}
        {sub.status !== 'rejected' && (
          <button className={styles.detailBtnReject} onClick={onReject}>
            <X size={14} /> Rechazar
          </button>
        )}
        <button className={styles.detailBtnDelete} onClick={onDelete}>
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

/* ── Helpers ───────────────────────────────────────────── */
function StatusBadge({ status }) {
  const map = {
    pending:  { label: 'Pendiente',  cls: styles.badgePending },
    accepted: { label: 'Aceptado',   cls: styles.badgeAccepted },
    rejected: { label: 'Rechazado',  cls: styles.badgeRejected },
  };
  const s = map[status] || map.pending;
  return <span className={`${styles.badge} ${s.cls}`}>{s.label}</span>;
}

function SkeletonList() {
  return (
    <div className={styles.list}>
      {[1,2,3,4].map(i => <div key={i} className={styles.skeletonRow} />)}
    </div>
  );
}

function EmptyState({ tab }) {
  return (
    <div className={styles.empty}>
      <FileText size={32} className={styles.emptyIcon} />
      <p>
        {tab === 'all'
          ? 'Aún no se han recibido envíos para esta convocatoria'
          : `No hay envíos con estado "${tab === 'pending' ? 'pendiente' : tab === 'accepted' ? 'aceptado' : 'rechazado'}"`
        }
      </p>
    </div>
  );
}