import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  AnimatePresence,
  motion,
} from 'framer-motion';

import {
  CalendarDays,
  Check,
  Clock3,
  Edit3,
  Lock,
  Mail,
  Plus,
  Play,
  Trash2,
  Users,
  X,
} from 'lucide-react';

import {
  closeConvocatoria,
  createConvocatoria,
  deleteConvocatoria,
  getConvocatorias,
  openConvocatoria,
  updateConvocatoria,
} from '../../api/convocatorias.api';

import useAlert from '../../hooks/useAlert';
import useConfirm from '../../hooks/useConfirm';

import styles from './ConvocatoriasPage.module.css';

const DEFAULT_CATEGORIES = [
  'Poesía',
  'Narrativa',
  'Ensayo',
  'Crítica',
  'Pensamiento',
  'Galería',
  'Entrevista',
  'Cultural',
];

const DEFAULT_RUBRICS = [
  'Nombre completo del autor o autora',
  'Breve semblanza de máximo 100 palabras',
  'Fotografía de retrato',
  'Ciudad de residencia',
  'Usuario de Instagram',
  'Categoría de participación',
  'Título de la obra o propuesta',
  'Obra o propuesta adjunta',
];

const EMPTY_FORM = {
  title: '',
  subtitle: '',
  description: '',
  requirements: '',
  prizes: '',
  categories: [],
  email_rubrics: DEFAULT_RUBRICS,
  contact_email:
    'contactoagorarevista@gmail.com',
  opens_at: '',
  closes_at: '',
  max_submissions: '',
  filled_slots: 0,
  max_file_size_mb: 10,
  is_active: true,
};

const toInputDateTime = value => {
  if (!value) {
    return '';
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return '';
  }

  const pad = number =>
    String(number).padStart(2, '0');

  return [
    date.getFullYear(),
    '-',
    pad(date.getMonth() + 1),
    '-',
    pad(date.getDate()),
    'T',
    pad(date.getHours()),
    ':',
    pad(date.getMinutes()),
  ].join('');
};

const toIsoDate = value => {
  if (!value) {
    return null;
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return null;
  }

  return date.toISOString();
};

const getStatus = item => {
  if (item.runtime_status) {
    return item.runtime_status;
  }

  const now = Date.now();

  const opensAt =
    item.opens_at
      ? new Date(
          item.opens_at
        ).getTime()
      : null;

  const closesAt =
    item.closes_at
      ? new Date(
          item.closes_at
        ).getTime()
      : null;

  const full =
    item.max_submissions !==
      null &&
    item.max_submissions !==
      undefined &&
    Number(item.filled_slots || 0) >=
      Number(item.max_submissions);

  if (!item.is_active) {
    return 'closed';
  }

  if (
    opensAt !== null &&
    opensAt > now
  ) {
    return 'scheduled';
  }

  if (
    closesAt !== null &&
    closesAt <= now
  ) {
    return 'closed';
  }

  if (full) {
    return 'full';
  }

  return 'open';
};

const formatDateTime = value => {
  if (!value) {
    return 'Sin definir';
  }

  return new Intl.DateTimeFormat(
    'es-MX',
    {
      dateStyle: 'medium',
      timeStyle: 'short',
    }
  ).format(
    new Date(value)
  );
};

export default function ConvocatoriasPage() {
  const alert = useAlert();
  const confirm = useConfirm();

  const [
    convocatorias,
    setConvocatorias,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    showForm,
    setShowForm,
  ] = useState(false);

  const [
    editingId,
    setEditingId,
  ] = useState(null);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    form,
    setForm,
  ] = useState(
    EMPTY_FORM
  );

  const setField = (
    key,
    value
  ) => {
    setForm(previous => ({
      ...previous,
      [key]: value,
    }));
  };

  const load = async () => {
    setLoading(true);

    try {
      const data =
        await getConvocatorias();

      setConvocatorias(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (error) {
      alert.error(
        'Error',
        error?.response?.data?.message ||
          'No se pudieron cargar las colaboraciones'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const grouped =
    useMemo(() => {
      return {
        scheduled:
          convocatorias.filter(
            item =>
              getStatus(item) ===
              'scheduled'
          ),

        open:
          convocatorias.filter(
            item =>
              getStatus(item) ===
              'open'
          ),

        full:
          convocatorias.filter(
            item =>
              getStatus(item) ===
              'full'
          ),

        closed:
          convocatorias.filter(
            item =>
              getStatus(item) ===
              'closed'
          ),
      };
    }, [convocatorias]);

  const openNew = () => {
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      email_rubrics: [
        ...DEFAULT_RUBRICS,
      ],
    });
    setShowForm(true);
  };

  const openEdit = item => {
    setEditingId(item.id);

    setForm({
      title:
        item.title || '',
      subtitle:
        item.subtitle || '',
      description:
        item.description || '',
      requirements:
        item.requirements || '',
      prizes:
        item.prizes || '',
      categories:
        Array.isArray(
          item.categories
        )
          ? item.categories
          : [],
      email_rubrics:
        Array.isArray(
          item.email_rubrics
        ) &&
        item.email_rubrics.length
          ? item.email_rubrics
          : [...DEFAULT_RUBRICS],
      contact_email:
        item.contact_email ||
        'contactoagorarevista@gmail.com',
      opens_at:
        toInputDateTime(
          item.opens_at
        ),
      closes_at:
        toInputDateTime(
          item.closes_at
        ),
      max_submissions:
        item.max_submissions ??
        '',
      filled_slots:
        item.filled_slots || 0,
      max_file_size_mb:
        item.max_file_size_mb ||
        10,
      is_active:
        item.is_active ?? true,
    });

    setShowForm(true);
  };

  const closeModal = () => {
    if (saving) {
      return;
    }

    setShowForm(false);
    setEditingId(null);
  };

  const toggleCategory =
    category => {
      setForm(previous => {
        const current =
          previous.categories || [];

        return {
          ...previous,
          categories:
            current.includes(
              category
            )
              ? current.filter(
                  item =>
                    item !==
                    category
                )
              : [
                  ...current,
                  category,
                ],
        };
      });
    };

  const updateRubric = (
    index,
    value
  ) => {
    setForm(previous => ({
      ...previous,
      email_rubrics:
        previous.email_rubrics.map(
          (item, itemIndex) =>
            itemIndex === index
              ? value
              : item
        ),
    }));
  };

  const addRubric = () => {
    setForm(previous => ({
      ...previous,
      email_rubrics: [
        ...previous.email_rubrics,
        '',
      ],
    }));
  };

  const removeRubric =
    index => {
      setForm(previous => ({
        ...previous,
        email_rubrics:
          previous.email_rubrics.filter(
            (
              _,
              itemIndex
            ) =>
              itemIndex !== index
          ),
      }));
    };

  const handleSave = async () => {
    if (!form.title.trim()) {
      alert.warning(
        'Falta el título',
        'Escribe un título para la colaboración'
      );
      return;
    }

    if (!form.closes_at) {
      alert.warning(
        'Falta el cierre',
        'Selecciona la fecha y hora de cierre'
      );
      return;
    }

    const opensAt =
      toIsoDate(
        form.opens_at
      );

    const closesAt =
      toIsoDate(
        form.closes_at
      );

    if (!closesAt) {
      alert.warning(
        'Fecha inválida',
        'La fecha de cierre no es válida'
      );
      return;
    }

    if (
      opensAt &&
      new Date(opensAt) >=
        new Date(closesAt)
    ) {
      alert.warning(
        'Fechas incorrectas',
        'La fecha de cierre debe ser posterior a la apertura'
      );
      return;
    }

    const maxSubmissions =
      form.max_submissions === ''
        ? null
        : Number.parseInt(
            form.max_submissions,
            10
          );

    const filledSlots =
      Number.parseInt(
        form.filled_slots,
        10
      ) || 0;

    if (
      maxSubmissions !== null &&
      filledSlots >
        maxSubmissions
    ) {
      alert.warning(
        'Cupos incorrectos',
        'Los cupos ocupados no pueden superar el cupo total'
      );
      return;
    }

    const cleanRubrics =
      form.email_rubrics
        .map(item =>
          item.trim()
        )
        .filter(Boolean);

    if (!cleanRubrics.length) {
      alert.warning(
        'Faltan rúbricas',
        'Agrega al menos un requisito para el correo'
      );
      return;
    }

    const payload = {
      ...form,
      title:
        form.title.trim(),
      subtitle:
        form.subtitle.trim() ||
        null,
      description:
        form.description.trim() ||
        null,
      requirements:
        form.requirements.trim() ||
        null,
      prizes:
        form.prizes.trim() ||
        null,
      contact_email:
        form.contact_email.trim() ||
        'contactoagorarevista@gmail.com',
      categories:
        form.categories,
      email_rubrics:
        cleanRubrics,
      opens_at:
        opensAt,
      closes_at:
        closesAt,
      max_submissions:
        maxSubmissions,
      filled_slots:
        filledSlots,
      max_file_size_mb:
        Number.parseInt(
          form.max_file_size_mb,
          10
        ) || 10,
      is_active:
        Boolean(
          form.is_active
        ),
    };

    setSaving(true);

    try {
      if (editingId) {
        await updateConvocatoria(
          editingId,
          payload
        );

        alert.success(
          'Actualizada',
          'La colaboración se actualizó correctamente'
        );
      } else {
        await createConvocatoria(
          payload
        );

        alert.success(
          'Creada',
          opensAt &&
          new Date(opensAt) >
            new Date()
            ? 'La colaboración quedó programada'
            : 'La colaboración quedó publicada'
        );
      }

      closeModal();
      await load();
    } catch (error) {
      alert.error(
        'No se pudo guardar',
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          'Ocurrió un error al guardar'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleOpen =
    async item => {
      const accepted =
        await confirm({
          type: 'success',
          title:
            '¿Abrir esta colaboración ahora?',
          message:
            `"${item.title}" quedará visible inmediatamente.`,
          confirmLabel:
            'Sí, abrir',
        });

      if (!accepted) {
        return;
      }

      try {
        await openConvocatoria(
          item.id
        );

        alert.success(
          'Colaboración abierta',
          'Ya se encuentra visible al público'
        );

        await load();
      } catch (error) {
        alert.error(
          'No se pudo abrir',
          error?.response?.data?.message ||
            error?.response?.data?.error ||
            'Actualiza la fecha de cierre e inténtalo nuevamente'
        );
      }
    };

  const handleClose =
    async item => {
      const accepted =
        await confirm({
          type: 'warning',
          title:
            '¿Cerrar esta colaboración?',
          message:
            `"${item.title}" dejará de mostrarse al público.`,
          confirmLabel:
            'Sí, cerrar',
        });

      if (!accepted) {
        return;
      }

      try {
        await closeConvocatoria(
          item.id
        );

        alert.success(
          'Colaboración cerrada',
          'Ya no está visible al público'
        );

        await load();
      } catch (error) {
        alert.error(
          'No se pudo cerrar',
          error?.response?.data?.message ||
            'Intenta nuevamente'
        );
      }
    };

  const handleDelete =
    async item => {
      const accepted =
        await confirm({
          type: 'error',
          title:
            '¿Eliminar definitivamente?',
          message:
            `"${item.title}" será eliminada y esta acción no se puede deshacer.`,
          confirmLabel:
            'Sí, eliminar',
        });

      if (!accepted) {
        return;
      }

      try {
        await deleteConvocatoria(
          item.id
        );

        alert.success(
          'Eliminada',
          'La colaboración fue eliminada'
        );

        await load();
      } catch (error) {
        alert.error(
          'No se pudo eliminar',
          error?.response?.data?.message ||
            'Intenta nuevamente'
        );
      }
    };

  return (
    <main className={styles.page}>
      <motion.header
        initial={{
          opacity: 0,
          y: 14,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        className={styles.header}
      >
        <div>
          <span
            className={
              styles.headerLabel
            }
          >
            Editorial
          </span>

          <h1>
            Colaboraciones
          </h1>

          <p>
            Programa aperturas, cierres y
            requisitos para recibir
            propuestas por correo.
          </p>
        </div>

        <button
          type="button"
          className={styles.newButton}
          onClick={openNew}
        >
          <Plus size={16} />
          Nueva colaboración
        </button>
      </motion.header>

      {loading ? (
        <div className={styles.loading}>
          Cargando colaboraciones…
        </div>
      ) : (
        <div
          className={
            styles.sections
          }
        >
          <StatusSection
            title="Abiertas"
            items={grouped.open}
            status="open"
            onEdit={openEdit}
            onOpen={handleOpen}
            onClose={handleClose}
            onDelete={handleDelete}
          />

          <StatusSection
            title="Programadas"
            items={
              grouped.scheduled
            }
            status="scheduled"
            onEdit={openEdit}
            onOpen={handleOpen}
            onClose={handleClose}
            onDelete={handleDelete}
          />

          <StatusSection
            title="Cupos agotados"
            items={grouped.full}
            status="full"
            onEdit={openEdit}
            onOpen={handleOpen}
            onClose={handleClose}
            onDelete={handleDelete}
          />

          <StatusSection
            title="Cerradas"
            items={grouped.closed}
            status="closed"
            onEdit={openEdit}
            onOpen={handleOpen}
            onClose={handleClose}
            onDelete={handleDelete}
          />

          {!convocatorias.length && (
            <div
              className={
                styles.empty
              }
            >
              <span>Λ</span>

              <h2>
                No hay colaboraciones todavía
              </h2>

              <p>
                Crea la primera para programar su apertura y cierre.
              </p>

              <button
                type="button"
                className={
                  styles.newButton
                }
                onClick={openNew}
              >
                <Plus size={15} />
                Crear colaboración
              </button>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <div
            className={
              styles.backdrop
            }
            onMouseDown={event => {
              if (
                event.target ===
                event.currentTarget
              ) {
                closeModal();
              }
            }}
          >
            <motion.section
              initial={{
                opacity: 0,
                scale: 0.97,
                y: 16,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.97,
                y: 16,
              }}
              className={
                styles.modal
              }
            >
              <header
                className={
                  styles.modalHeader
                }
              >
                <div>
                  <span>
                    Gestión editorial
                  </span>

                  <h2>
                    {editingId
                      ? 'Editar colaboración'
                      : 'Nueva colaboración'}
                  </h2>
                </div>

                <button
                  type="button"
                  className={
                    styles.iconButton
                  }
                  onClick={closeModal}
                >
                  <X size={18} />
                </button>
              </header>

              <div
                className={
                  styles.modalBody
                }
              >
                <FormSection
                  title="Información principal"
                >
                  <div
                    className={
                      styles.formGrid
                    }
                  >
                    <FormField
                      label="Título"
                      wide
                    >
                      <input
                        value={
                          form.title
                        }
                        onChange={
                          event =>
                            setField(
                              'title',
                              event.target
                                .value
                            )
                        }
                        placeholder="Título de la colaboración"
                      />
                    </FormField>

                    <FormField
                      label="Subtítulo"
                      wide
                    >
                      <input
                        value={
                          form.subtitle
                        }
                        onChange={
                          event =>
                            setField(
                              'subtitle',
                              event.target
                                .value
                            )
                        }
                        placeholder="Una breve invitación"
                      />
                    </FormField>

                    <FormField
                      label="Descripción"
                      wide
                    >
                      <textarea
                        rows={6}
                        value={
                          form.description
                        }
                        onChange={
                          event =>
                            setField(
                              'description',
                              event.target
                                .value
                            )
                        }
                        placeholder="Explica el espíritu de la colaboración"
                      />
                    </FormField>

                    <FormField
                      label="Bases y requisitos"
                      wide
                    >
                      <textarea
                        rows={5}
                        value={
                          form.requirements
                        }
                        onChange={
                          event =>
                            setField(
                              'requirements',
                              event.target
                                .value
                            )
                        }
                        placeholder="Formatos, extensión, condiciones y demás bases"
                      />
                    </FormField>

                    <FormField
                      label="Publicación o reconocimientos"
                      wide
                    >
                      <textarea
                        rows={4}
                        value={
                          form.prizes
                        }
                        onChange={
                          event =>
                            setField(
                              'prizes',
                              event.target
                                .value
                            )
                        }
                        placeholder="Publicación, difusión, premios o reconocimientos"
                      />
                    </FormField>
                  </div>
                </FormSection>

                <FormSection
                  title="Categorías aceptadas"
                >
                  <div
                    className={
                      styles.categoryGrid
                    }
                  >
                    {DEFAULT_CATEGORIES.map(
                      category => (
                        <button
                          key={category}
                          type="button"
                          className={`${styles.categoryButton} ${
                            form.categories.includes(
                              category
                            )
                              ? styles.categoryButtonActive
                              : ''
                          }`}
                          onClick={() =>
                            toggleCategory(
                              category
                            )
                          }
                        >
                          {form.categories.includes(
                            category
                          ) && (
                            <Check
                              size={13}
                            />
                          )}

                          {category}
                        </button>
                      )
                    )}
                  </div>
                </FormSection>

                <FormSection
                  title="Correo y rúbricas"
                >
                  <div
                    className={
                      styles.formGrid
                    }
                  >
                    <FormField
                      label="Correo receptor"
                      wide
                    >
                      <input
                        type="email"
                        value={
                          form.contact_email
                        }
                        onChange={
                          event =>
                            setField(
                              'contact_email',
                              event.target
                                .value
                            )
                        }
                      />
                    </FormField>
                  </div>

                  <div
                    className={
                      styles.rubricList
                    }
                  >
                    {form.email_rubrics.map(
                      (
                        rubric,
                        index
                      ) => (
                        <div
                          key={index}
                          className={
                            styles.rubricRow
                          }
                        >
                          <span>
                            {index + 1}
                          </span>

                          <input
                            value={
                              rubric
                            }
                            onChange={
                              event =>
                                updateRubric(
                                  index,
                                  event.target
                                    .value
                                )
                            }
                          />

                          <button
                            type="button"
                            onClick={() =>
                              removeRubric(
                                index
                              )
                            }
                            disabled={
                              form.email_rubrics
                                .length ===
                              1
                            }
                          >
                            <Trash2
                              size={14}
                            />
                          </button>
                        </div>
                      )
                    )}
                  </div>

                  <button
                    type="button"
                    className={
                      styles.secondaryButton
                    }
                    onClick={addRubric}
                  >
                    <Plus size={14} />
                    Agregar rúbrica
                  </button>
                </FormSection>

                <FormSection
                  title="Programación y cupos"
                >
                  <div
                    className={
                      styles.formGrid
                    }
                  >
                    <FormField
                      label="Fecha de apertura"
                    >
                      <input
                        type="datetime-local"
                        value={
                          form.opens_at
                        }
                        onChange={
                          event =>
                            setField(
                              'opens_at',
                              event.target
                                .value
                            )
                        }
                      />
                    </FormField>

                    <FormField
                      label="Fecha de cierre"
                    >
                      <input
                        type="datetime-local"
                        value={
                          form.closes_at
                        }
                        onChange={
                          event =>
                            setField(
                              'closes_at',
                              event.target
                                .value
                            )
                        }
                      />
                    </FormField>

                    <FormField
                      label="Cupo total"
                    >
                      <input
                        type="number"
                        min="1"
                        value={
                          form.max_submissions
                        }
                        onChange={
                          event =>
                            setField(
                              'max_submissions',
                              event.target
                                .value
                            )
                        }
                        placeholder="Sin límite"
                      />
                    </FormField>

                    <FormField
                      label="Cupos ocupados"
                    >
                      <input
                        type="number"
                        min="0"
                        value={
                          form.filled_slots
                        }
                        onChange={
                          event =>
                            setField(
                              'filled_slots',
                              event.target
                                .value
                            )
                        }
                      />
                    </FormField>

                    <FormField
                      label="Peso máximo por adjunto"
                    >
                      <div
                        className={
                          styles.inputSuffix
                        }
                      >
                        <input
                          type="number"
                          min="1"
                          value={
                            form.max_file_size_mb
                          }
                          onChange={
                            event =>
                              setField(
                                'max_file_size_mb',
                                event.target
                                  .value
                              )
                          }
                        />

                        <span>MB</span>
                      </div>
                    </FormField>
                  </div>

                  <label
                    className={
                      styles.toggleRow
                    }
                  >
                    <div>
                      <strong>
                        Colaboración habilitada
                      </strong>

                      <span>
                        Las fechas seguirán determinando si está programada, abierta o cerrada.
                      </span>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={
                        form.is_active
                      }
                      className={`${styles.toggle} ${
                        form.is_active
                          ? styles.toggleActive
                          : ''
                      }`}
                      onClick={() =>
                        setField(
                          'is_active',
                          !form.is_active
                        )
                      }
                    >
                      <span />
                    </button>
                  </label>
                </FormSection>
              </div>

              <footer
                className={
                  styles.modalFooter
                }
              >
                <button
                  type="button"
                  className={
                    styles.cancelButton
                  }
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  className={
                    styles.saveButton
                  }
                  onClick={handleSave}
                  disabled={saving}
                >
                  <Check size={15} />

                  {saving
                    ? 'Guardando…'
                    : editingId
                      ? 'Guardar cambios'
                      : 'Crear colaboración'}
                </button>
              </footer>
            </motion.section>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}

function StatusSection({
  title,
  items,
  status,
  onEdit,
  onOpen,
  onClose,
  onDelete,
}) {
  if (!items.length) {
    return null;
  }

  return (
    <section
      className={
        styles.statusSection
      }
    >
      <div
        className={
          styles.statusHeading
        }
      >
        <h2>{title}</h2>
        <span>{items.length}</span>
      </div>

      <div className={styles.list}>
        {items.map(
          (
            item,
            index
          ) => (
            <CollaborationRow
              key={item.id}
              item={item}
              index={index}
              status={status}
              onEdit={onEdit}
              onOpen={onOpen}
              onClose={onClose}
              onDelete={onDelete}
            />
          )
        )}
      </div>
    </section>
  );
}

function CollaborationRow({
  item,
  index,
  status,
  onEdit,
  onOpen,
  onClose,
  onDelete,
}) {
  const available =
    item.available_slots ??
    (
      item.max_submissions !==
        null &&
      item.max_submissions !==
        undefined
        ? Math.max(
            0,
            Number(
              item.max_submissions
            ) -
              Number(
                item.filled_slots ||
                0
              )
          )
        : null
    );

  return (
    <motion.article
      initial={{
        opacity: 0,
        y: 10,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        delay:
          index * 0.04,
      }}
      className={
        styles.row
      }
    >
      <div
        className={`${styles.statusBar} ${styles[`status_${status}`]}`}
      />

      <div
        className={
          styles.rowContent
        }
      >
        <div
          className={
            styles.rowTop
          }
        >
          <div>
            <span
              className={`${styles.statusBadge} ${styles[`badge_${status}`]}`}
            >
              {status === 'open' &&
                'Abierta'}

              {status ===
                'scheduled' &&
                'Programada'}

              {status === 'full' &&
                'Cupo agotado'}

              {status ===
                'closed' &&
                'Cerrada'}
            </span>

            <h3>{item.title}</h3>

            {item.subtitle && (
              <p>{item.subtitle}</p>
            )}
          </div>

          <div
            className={
              styles.rowActions
            }
          >
            <button
              type="button"
              onClick={() =>
                onEdit(item)
              }
              title="Editar"
            >
              <Edit3 size={15} />
            </button>

            {status === 'open' ? (
              <button
                type="button"
                onClick={() =>
                  onClose(item)
                }
                title="Cerrar"
              >
                <Lock size={15} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() =>
                  onOpen(item)
                }
                title="Abrir ahora"
              >
                <Play size={15} />
              </button>
            )}

            <button
              type="button"
              className={
                styles.deleteButton
              }
              onClick={() =>
                onDelete(item)
              }
              title="Eliminar"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        <div
          className={
            styles.rowMetadata
          }
        >
          <span>
            <CalendarDays
              size={13}
            />

            Apertura:
            <strong>
              {formatDateTime(
                item.opens_at
              )}
            </strong>
          </span>

          <span>
            <Clock3 size={13} />

            Cierre:
            <strong>
              {formatDateTime(
                item.closes_at
              )}
            </strong>
          </span>

          <span>
            <Users size={13} />

            Cupos:
            <strong>
              {item.max_submissions
                ? `${available} de ${item.max_submissions}`
                : 'Sin límite'}
            </strong>
          </span>

          <span>
            <Mail size={13} />

            <strong>
              {item.contact_email}
            </strong>
          </span>
        </div>
      </div>
    </motion.article>
  );
}

function FormSection({
  title,
  children,
}) {
  return (
    <section
      className={
        styles.formSection
      }
    >
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function FormField({
  label,
  children,
  wide = false,
}) {
  return (
    <label
      className={`${styles.formField} ${
        wide
          ? styles.formFieldWide
          : ''
      }`}
    >
      <span>{label}</span>
      {children}
    </label>
  );
}