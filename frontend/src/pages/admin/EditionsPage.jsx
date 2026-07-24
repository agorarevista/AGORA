import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getEditions, createEdition, updateEdition, setCurrentEdition } from '../../api/editions.api';
import { uploadFile } from '../../api/admin.api';
import useAlert from '../../hooks/useAlert';
import { Plus, Edit, Star, Upload, X, Check, BookOpen } from 'lucide-react';
import { formatDate } from '../../utils/formatDate';
import styles from './EditionsPage.module.css';

const EMPTY_FORM = {
  number: '',
  name: '',
  description: '',
  cover_image_url: '',
  published_at: '',
  is_current: false,
  is_special: false,
};

const dateInputToISOString = dateValue => {
  if (!dateValue) {
    return null;
  }

  const [
    year,
    month,
    day,
  ] = dateValue
    .split('-')
    .map(Number);

  if (
    !year ||
    !month ||
    !day
  ) {
    return null;
  }

  /*
   * Se guarda a mediodía local para evitar
   * que la conversión UTC cambie el día.
   */
  return new Date(
    year,
    month - 1,
    day,
    12,
    0,
    0,
    0
  ).toISOString();
};

export default function EditionsPage() {
  const alert = useAlert();
  const [editions, setEditions]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [uploading, setUploading] = useState(false);
  const [confirmCurrentOpen, setConfirmCurrentOpen] = useState(false);
  const [editionToConfirm, setEditionToConfirm] = useState(null);

  const load = async () => {
    setLoading(true);
    try { setEditions(await getEditions()); }
    catch { alert.error('Error', 'No se pudieron cargar las ediciones'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew =
    () => {
      const regularNumbers =
        editions
          .filter(
            edition =>
              !edition.is_special
          )
          .map(
            edition =>
              Number(
                edition.number
              )
          )
          .filter(
            number =>
              Number.isInteger(
                number
              ) &&
              number > 0
          );

      const nextNumber =
        regularNumbers.length >
        0
          ? Math.max(
              ...regularNumbers
            ) + 1
          : 1;

      setEditing(null);

      setForm({
        ...EMPTY_FORM,

        number:
          nextNumber,
      });

      setShowForm(true);
    };
  const openEdit = ed => {
    setEditing(ed.id);

    setForm({
      number:
        ed.is_special
          ? ''
          : ed.number ??
            '',

      name:
        ed.name ||
        '',

      description:
        ed.description ||
        '',

      cover_image_url:
        ed.cover_image_url ||
        '',

      published_at:
        ed.published_at
          ? String(
              ed.published_at
            ).slice(
              0,
              10
            )
          : '',

      is_current:
        Boolean(
          ed.is_current
        ),

      is_special:
        Boolean(
          ed.is_special
        ),
    });

    setShowForm(true);
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadFile(file, 'covers');
      setForm(f => ({ ...f, cover_image_url: res.url }));
      alert.success('Portada subida', 'Imagen cargada correctamente');
    } catch { alert.error('Error', 'No se pudo subir la imagen'); }
    finally { setUploading(false); }
  };

  const handleSave =
    async () => {
      const cleanName =
        form.name.trim();

      const isSpecial =
        Boolean(
          form.is_special
        );

      const parsedNumber =
        Number.parseInt(
          form.number,
          10
        );

      if (!cleanName) {
        alert.warning(
          'Faltan datos',
          'El nombre de la edición es obligatorio'
        );

        return;
      }

      if (
        !isSpecial &&
        (
          !Number.isInteger(
            parsedNumber
          ) ||
          parsedNumber < 1
        )
      ) {
        alert.warning(
          'Faltan datos',
          'Las ediciones regulares necesitan un número válido'
        );

        return;
      }

      setSaving(true);

      try {
        const payload = {
          number:
            isSpecial
              ? null
              : parsedNumber,

          name:
            cleanName,

          description:
            form.description
              .trim(),

          cover_image_url:
            form.cover_image_url
              .trim(),

          published_at:
            dateInputToISOString(
              form.published_at
            ),

          is_special:
            isSpecial,
        };

      let savedEditionId =
        editing;

      if (editing) {
        await updateEdition(
          editing,
          payload
        );
      } else {
        const createdEdition =
          await createEdition(
            payload
          );

        savedEditionId =
          createdEdition?.id ||
          createdEdition?.data?.id;

        if (!savedEditionId) {
          throw new Error(
            'La API no devolvió el ID de la edición creada'
          );
        }
      }

      const wasCurrent =
        Boolean(
          editions.find(
            edition =>
              String(edition.id) ===
              String(savedEditionId)
          )?.is_current
        );

      if (
        form.is_current &&
        !wasCurrent
      ) {
        await setCurrentEdition(
          savedEditionId
        );
      }

      if (
        editing &&
        wasCurrent &&
        !form.is_current
      ) {
        await updateEdition(
          savedEditionId,
          {
            is_current: false,
          }
        );
      }

      alert.success(
        editing
          ? 'Actualizada'
          : 'Creada',

        form.is_current
          ? 'La edición fue guardada y establecida como edición actual'
          : editing
            ? 'Edición actualizada correctamente'
            : 'Edición creada correctamente'
      );

      setShowForm(false);
      setEditing(null);
      setForm(EMPTY_FORM);

      await load();
    } catch (error) {
      alert.error(
        'Error',
        error.response?.data?.error ||
        error.message ||
        'No se pudo guardar'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSetCurrent = (ed) => {
    if (ed.is_current) return;
    setEditionToConfirm(ed);
    setConfirmCurrentOpen(true);
  };

  const confirmSetCurrent = async () => {
    if (!editionToConfirm) return;

    try {
      await setCurrentEdition(editionToConfirm.id);
      const editionLabel =
        editionToConfirm
          .is_special
          ? `Especial — ${editionToConfirm.name}`
          : `№${editionToConfirm.number} — ${editionToConfirm.name}`;

      alert.success(
        'Edición actual',
        `${editionLabel} es ahora la edición actual`
      );
      setConfirmCurrentOpen(false);
      setEditionToConfirm(null);
      load();
    } catch {
      alert.error('Error', 'No se pudo actualizar');
    }
  };

  const cancelSetCurrent = () => {
    setConfirmCurrentOpen(false);
    setEditionToConfirm(null);
  };

  const current    = editions.find(e => e.is_current);
  const historical = editions.filter(e => !e.is_current);

  return (
    <div className={styles.page}>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className={styles.header}
      >
        <div>
          <div className={styles.headerLabel}>Revista</div>
          <h1 className={styles.headerTitle}>Ediciones</h1>
        </div>
        <button onClick={openNew} className={styles.newBtn}>
          <Plus size={16} /> Nueva edición
        </button>
      </motion.div>

      {/* Modal */}
      {showForm && (
        <div className={styles.modalOverlay} onClick={() => setShowForm(false)}>
          <motion.div
            className={styles.modal}
            onClick={e => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
          >
            <div className={styles.modalHeader}>
              <h3>{editing ? 'Editar edición' : 'Nueva edición'}</h3>
              <button onClick={() => setShowForm(false)} className={styles.modalClose}><X size={18} /></button>
            </div>

            <div className={styles.modalBody}>
              {/* Portada */}
              <div className={styles.coverSection}>
                {form.cover_image_url ? (
                  <div className={styles.coverPreview}>
                    <img src={form.cover_image_url} alt="Portada" />
                    <button className={styles.removeCover} onClick={() => setForm(f => ({ ...f, cover_image_url: '' }))}>
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div className={styles.coverEmpty}>
                    <BookOpen size={28} />
                    <span>Sin portada</span>
                  </div>
                )}
                <label className={styles.uploadBtn}>
                  <Upload size={13} />
                  {uploading ? 'Subiendo...' : 'Subir portada'}
                  <input type="file" accept="image/*" onChange={handleCoverUpload} hidden />
                </label>
                <input
                  type="text"
                  value={form.cover_image_url}
                  onChange={e => setForm(f => ({ ...f, cover_image_url: e.target.value }))}
                  className={styles.input}
                  placeholder="O pega URL de portada..."
                />
              </div>

              <div
                className={
                  styles.formGrid
                }
              >
                {!form.is_special ? (
                  <div
                    className={
                      styles.formGroup
                    }
                  >
                    <label
                      className={
                        styles.label
                      }
                    >
                      Número *
                    </label>

                    <input
                      type="number"
                      value={
                        form.number
                      }
                      onChange={
                        event => {
                          setForm(
                            previous => ({
                              ...previous,

                              number:
                                event
                                  .target
                                  .value,
                            })
                          );
                        }
                      }
                      className={
                        styles.input
                      }
                      min={1}
                    />
                  </div>
                ) : (
                  <div
                    className={
                      styles.specialNumberNotice
                    }
                  >
                    <strong>
                      Sin numeración
                    </strong>

                    <span>
                      Las ediciones especiales se identifican por su título.
                    </span>
                  </div>
                )}

                <div
                  className={
                    styles.formGroup
                  }
                >
                  <label
                    className={
                      styles.label
                    }
                  >
                    Fecha de publicación
                  </label>

                  <input
                    type="date"
                    value={
                      form.published_at
                    }
                    onChange={
                      event => {
                        setForm(
                          previous => ({
                            ...previous,

                            published_at:
                              event
                                .target
                                .value,
                          })
                        );
                      }
                    }
                    className={
                      styles.input
                    }
                  />
                </div>

                <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                  <label className={styles.label}>Nombre / Título de la edición *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className={styles.input}
                    placeholder="ej: Voces del norte"
                  />
                </div>

                <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                  <label className={styles.label}>Descripción</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    className={styles.textarea}
                    rows={3}
                    placeholder="Temática o descripción de la edición..."
                  />
                </div>
              </div>
            </div>

          <div
            className={
              styles.editionOptions
            }
          >
            <label
              className={
                styles.editionOption
              }
            >
              <input
                type="checkbox"
                checked={
                  form.is_special
                }
                onChange={
                  event => {
                    const isSpecial =
                      event.target
                        .checked;

                    setForm(
                      previous => {
                        if (isSpecial) {
                          return {
                            ...previous,

                            is_special:
                              true,

                            number:
                              '',
                          };
                        }

                        const regularNumbers =
                          editions
                            .filter(
                              edition =>
                                !edition
                                  .is_special
                            )
                            .map(
                              edition =>
                                Number(
                                  edition
                                    .number
                                )
                            )
                            .filter(
                              number =>
                                Number
                                  .isInteger(
                                    number
                                  ) &&
                                number > 0
                            );

                        const nextNumber =
                          regularNumbers
                            .length > 0
                            ? Math.max(
                                ...regularNumbers
                              ) + 1
                            : 1;

                        return {
                          ...previous,

                          is_special:
                            false,

                          number:
                            previous
                              .number ||
                            nextNumber,
                        };
                      }
                    );
                  }
                }
              />

              <span>
                <strong>
                  Edición especial
                </strong>

                <small>
                  Aparecerá en “Ediciones especiales” del navbar.
                </small>
              </span>
            </label>

            <label
              className={
                styles.editionOption
              }
            >
              <input
                type="checkbox"
                checked={
                  form.is_current
                }
                onChange={event => {
                  setForm(previous => ({
                    ...previous,
                    is_current:
                      event.target
                        .checked,
                  }));
                }}
              />

              <span>
                <strong>
                  Establecer como edición actual
                </strong>

                <small>
                  Reemplazará automáticamente cualquier edición actual existente.
                </small>
              </span>
            </label>
          </div>

            <div className={styles.modalFooter}>
              <button onClick={() => setShowForm(false)} className={styles.cancelBtn}>Cancelar</button>
              <button onClick={handleSave} disabled={saving} className={styles.saveBtn}>
                <Check size={14} />
                {saving ? 'Guardando...' : editing ? 'Actualizar' : 'Crear edición'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal confirmación edición actual */}
      {confirmCurrentOpen && editionToConfirm && (
        <div className={styles.modalOverlay} onClick={cancelSetCurrent}>
          <motion.div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
          >
            <div className={styles.modalHeader}>
              <h3>Establecer como edición actual</h3>
              <button onClick={cancelSetCurrent} className={styles.modalClose}>
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <p
                className={
                  styles.confirmText
                }
              >
                ¿Establecer{' '}
                <strong>
                  {editionToConfirm
                    .is_special
                    ? `la edición especial “${editionToConfirm.name}”`
                    : `la edición №${editionToConfirm.number}`}
                </strong>{' '}
                como la edición actual?
              </p>
              <p className={styles.confirmSubtext}>
                Esto reemplazará la edición actual visible en la portada del sitio.
              </p>
            </div>

            <div className={styles.modalFooter}>
              <button onClick={cancelSetCurrent} className={styles.cancelBtn}>
                Cancelar
              </button>
              <button onClick={confirmSetCurrent} className={styles.saveBtn}>
                <Star size={14} />
                Confirmar
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edición actual */}
      {current && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className={styles.currentCard}
        >
          <div className={styles.currentBadge}>
            <Star size={12} fill="currentColor" /> Edición actual
          </div>
          <div className={styles.currentInner}>
            {current.cover_image_url && (
              <img src={current.cover_image_url} alt="" className={styles.currentCover} />
            )}
            <div className={styles.currentInfo}>
              <div
                className={
                  styles.currentNumber
                }
              >
                {current.is_special
                  ? 'Edición especial'
                  : `№ ${current.number}`}
              </div>

              <h2
                className={
                  styles.currentName
                }
              >
                {current.name}
              </h2>
              {current.description && <p className={styles.currentDesc}>{current.description}</p>}
              {current.published_at && (
                <div className={styles.currentDate}>Publicada: {formatDate(current.published_at)}</div>
              )}
            </div>
            <button onClick={() => openEdit(current)} className={styles.editCurrentBtn}>
              <Edit size={14} /> Editar
            </button>
          </div>
        </motion.div>
      )}

      {/* Historial */}
      {loading ? (
        <div className={styles.grid}>
          {[1,2,3].map(i => <div key={i} className={styles.skeletonCard} />)}
        </div>
      ) : historical.length > 0 ? (
        <div className={styles.histSection}>
          <div className={styles.histTitle}>Archivo histórico</div>
          <div className={styles.grid}>
            {historical.map((ed, i) => (
              <motion.div
                key={ed.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={styles.edCard}
              >
                <div className={styles.edCover}>
                  {ed.cover_image_url
                    ? <img src={ed.cover_image_url} alt="" />
                    : <div className={styles.edCoverEmpty}><BookOpen size={24} /></div>
                  }
                </div>
                <div className={styles.edInfo}>
                  <div
                    className={
                      styles.edNumber
                    }
                  >
                    {ed.is_special
                      ? 'Edición especial'
                      : `№ ${ed.number}`}
                  </div>

                  <div
                    className={
                      styles.edName
                    }
                  >
                    {ed.name}
                  </div>
                  {ed.published_at && (
                    <div className={styles.edDate}>{formatDate(ed.published_at)}</div>
                  )}
                </div>
                <div className={styles.edActions}>
                  <button
                    className={`${styles.actionBtn} ${styles.actionStar}`}
                    onClick={() => handleSetCurrent(ed)}
                    title="Establecer como actual"
                  >
                    <Star size={13} />
                  </button>
                  <button className={styles.actionBtn} onClick={() => openEdit(ed)} title="Editar">
                    <Edit size={13} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ) : !current ? (
        <div className={styles.empty}>
          <span>◈</span>
          <p>No hay ediciones todavía. Crea la primera.</p>
        </div>
      ) : null}

    </div>
  );
}