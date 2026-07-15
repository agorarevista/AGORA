import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  UploadCloud,
  X,
  FileArchive,
  FileCode2,
  CheckCircle2,
  AlertTriangle,
  LoaderCircle,
} from 'lucide-react';

import {
  getCategories,
} from '../../../api/categories.api';

import {
  getCollaborators,
} from '../../../api/collaborators.api';

import {
  importSubstackArticles,
} from '../../../api/articleTransfer.api';

import useAlert from '../../../hooks/useAlert';

import styles from './ArticleTransferModal.module.css';

const flattenCategories = (
  categories,
  parent = null
) => {
  if (!Array.isArray(categories)) {
    return [];
  }

  return categories.flatMap(
    category => {
      const normalized = {
        ...category,

        parent_slug:
          category.parent_slug ||
          category.parent?.slug ||
          parent?.slug ||
          null,
      };

      const children =
        category.children ||
        category.subcategories ||
        category.categories ||
        [];

      return [
        normalized,

        ...flattenCategories(
          children,
          category
        ),
      ];
    }
  );
};

export default function ArticleTransferModal({
  open,
  onClose,
  onImported,
}) {
  const alert = useAlert();

  const [
    files,
    setFiles,
  ] = useState([]);

  const [
    categories,
    setCategories,
  ] = useState([]);

  const [
    collaborators,
    setCollaborators,
  ] = useState([]);

  const [
    collaboratorId,
    setCollaboratorId,
  ] = useState('');

  const [
    categoryIds,
    setCategoryIds,
  ] = useState([]);

  const [
    status,
    setStatus,
  ] = useState('draft');

  const [
    downloadImages,
    setDownloadImages,
  ] = useState(true);

  const [
    duplicateMode,
    setDuplicateMode,
  ] = useState('skip');

  const [
    importing,
    setImporting,
  ] = useState(false);

  const [
    result,
    setResult,
  ] = useState(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    Promise.all([
      getCategories(),
      getCollaborators(),
    ])
      .then(
        ([
          categoryResponse,
          collaboratorResponse,
        ]) => {
          setCategories(
            categoryResponse ||
            []
          );

          setCollaborators(
            collaboratorResponse ||
            []
          );
        }
      )
      .catch(error => {
        console.error(error);

        alert.error(
          'Error',
          'No se pudieron cargar autores y secciones'
        );
      });
  }, [
    open,
  ]);

  useEffect(() => {
    if (open) {
      setFiles([]);
      setCategoryIds([]);
      setCollaboratorId('');
      setStatus('draft');
      setDownloadImages(true);
      setDuplicateMode('skip');
      setResult(null);
    }
  }, [open]);

  const availableCategories =
    useMemo(() => {
      return flattenCategories(
        categories
      ).filter(category => {
        const isChild =
          category.nav_type
            ? category.nav_type ===
              'child'
            : Boolean(
                category.parent_id ||
                category.parent_slug
              );

        return (
          isChild &&
          category.is_active !==
            false &&
          category.slug !==
            'galeria'
        );
      });
    }, [categories]);

  if (!open) {
    return null;
  }

  const toggleCategory =
    categoryId => {
      setCategoryIds(
        previous => {
          if (
            previous.includes(
              categoryId
            )
          ) {
            return previous.filter(
              id =>
                id !== categoryId
            );
          }

          return [
            ...previous,
            categoryId,
          ];
        }
      );
    };

  const handleFiles =
    event => {
      const selected =
        Array.from(
          event.target.files ||
          []
        );

      const valid =
        selected.filter(file => {
          return (
            /\.html?$/i.test(
              file.name
            ) ||
            /\.zip$/i.test(
              file.name
            )
          );
        });

      setFiles(valid);
      setResult(null);

      event.target.value = '';
    };

  const removeFile =
    targetName => {
      setFiles(previous =>
        previous.filter(
          file =>
            file.name !==
            targetName
        )
      );
    };

  const handleImport =
    async () => {
      if (
        files.length === 0
      ) {
        alert.warning(
          'Faltan archivos',
          'Selecciona el ZIP o los HTML exportados desde Substack'
        );

        return;
      }

      setImporting(true);
      setResult(null);

      try {
        const response =
          await importSubstackArticles({
            files,
            collaboratorId,
            categoryIds,
            status,
            downloadImages,
            duplicateMode,
          });

        setResult(response);

        alert.success(
          'Importación terminada',
          `${response.created} creados, ${response.updated} actualizados y ${response.skipped} omitidos`
        );

        await onImported?.();
      } catch (error) {
        console.error(error);

        alert.error(
          'Error de importación',
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          'No se pudieron importar los artículos'
        );
      } finally {
        setImporting(false);
      }
    };

  return (
    <div
      className={
        styles.backdrop
      }
      onMouseDown={event => {
        if (
          event.target ===
          event.currentTarget &&
          !importing
        ) {
          onClose();
        }
      }}
    >
      <div
        className={
          styles.modal
        }
      >
        <div
          className={
            styles.topBar
          }
        />

        <header
          className={
            styles.header
          }
        >
          <div>
            <div
              className={
                styles.eyebrow
              }
            >
              Migración de contenido
            </div>

            <h2>
              Importar desde Substack
            </h2>

            <p>
              Sube el respaldo ZIP completo o uno o varios archivos HTML.
            </p>
          </div>

          <button
            type="button"
            className={
              styles.closeBtn
            }
            onClick={onClose}
            disabled={importing}
          >
            <X size={18} />
          </button>
        </header>

        <div
          className={
            styles.body
          }
        >
          <label
            className={
              styles.dropzone
            }
          >
            <UploadCloud
              size={30}
            />

            <strong>
              Seleccionar respaldo
            </strong>

            <span>
              ZIP, HTML o múltiples HTML
            </span>

            <input
              type="file"
              accept=".zip,.html,.htm"
              multiple
              onChange={
                handleFiles
              }
              hidden
            />
          </label>

          {files.length > 0 && (
            <div
              className={
                styles.fileList
              }
            >
              {files.map(file => (
                <div
                  key={file.name}
                  className={
                    styles.fileItem
                  }
                >
                  {file.name
                    .toLowerCase()
                    .endsWith(
                      '.zip'
                    ) ? (
                    <FileArchive
                      size={16}
                    />
                  ) : (
                    <FileCode2
                      size={16}
                    />
                  )}

                  <span>
                    {file.name}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      removeFile(
                        file.name
                      )
                    }
                    disabled={
                      importing
                    }
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div
            className={
              styles.grid
            }
          >
            <div
              className={
                styles.field
              }
            >
              <label>
                Autor
              </label>

              <select
                value={
                  collaboratorId
                }
                onChange={event =>
                  setCollaboratorId(
                    event.target.value
                  )
                }
              >
                <option value="">
                  Agorá Revista
                </option>

                {collaborators.map(
                  collaborator => (
                    <option
                      key={
                        collaborator.id
                      }
                      value={
                        collaborator.id
                      }
                    >
                      {
                        collaborator.name
                      }
                    </option>
                  )
                )}
              </select>
            </div>

            <div
              className={
                styles.field
              }
            >
              <label>
                Estado inicial
              </label>

              <select
                value={status}
                onChange={event =>
                  setStatus(
                    event.target.value
                  )
                }
              >
                <option value="draft">
                  Importar como borrador
                </option>

                <option value="published">
                  Conservar como publicado
                </option>
              </select>
            </div>

            <div
              className={
                styles.field
              }
            >
              <label>
                Artículos duplicados
              </label>

              <select
                value={
                  duplicateMode
                }
                onChange={event =>
                  setDuplicateMode(
                    event.target.value
                  )
                }
              >
                <option value="skip">
                  Omitir duplicados
                </option>

                <option value="update">
                  Actualizar existentes
                </option>

                <option value="copy">
                  Crear una copia
                </option>
              </select>
            </div>
          </div>

          <div
            className={
              styles.categoryBlock
            }
          >
            <div
              className={
                styles.blockLabel
              }
            >
              Secciones
            </div>

            <div
              className={
                styles.categoryGrid
              }
            >
              {availableCategories.map(
                category => (
                  <label
                    key={
                      category.id
                    }
                    className={
                      styles.categoryOption
                    }
                  >
                    <input
                      type="checkbox"
                      checked={
                        categoryIds.includes(
                          category.id
                        )
                      }
                      onChange={() =>
                        toggleCategory(
                          category.id
                        )
                      }
                    />

                    <span>
                      {
                        category.name
                      }
                    </span>
                  </label>
                )
              )}
            </div>
          </div>

          <label
            className={
              styles.checkOption
            }
          >
            <input
              type="checkbox"
              checked={
                downloadImages
              }
              onChange={event =>
                setDownloadImages(
                  event.target.checked
                )
              }
            />

            <span>
              <strong>
                Migrar imágenes a R2
              </strong>

              Descargar las imágenes de Substack y reemplazar sus URLs.
            </span>
          </label>

          {result && (
            <div
              className={
                styles.result
              }
            >
              {result.errors > 0
                ? (
                  <AlertTriangle
                    size={20}
                  />
                )
                : (
                  <CheckCircle2
                    size={20}
                  />
                )}

              <div>
                <strong>
                  Importación completada
                </strong>

                <span>
                  {result.created} creados ·{' '}
                  {result.updated} actualizados ·{' '}
                  {result.skipped} omitidos ·{' '}
                  {result.errors} errores
                </span>
              </div>
            </div>
          )}
        </div>

        <footer
          className={
            styles.footer
          }
        >
          <button
            type="button"
            className={
              styles.cancelBtn
            }
            onClick={onClose}
            disabled={importing}
          >
            Cerrar
          </button>

          <button
            type="button"
            className={
              styles.importBtn
            }
            onClick={
              handleImport
            }
            disabled={
              importing ||
              files.length === 0
            }
          >
            {importing ? (
              <>
                <LoaderCircle
                  size={16}
                  className={
                    styles.spinning
                  }
                />

                Importando...
              </>
            ) : (
              <>
                <UploadCloud
                  size={16}
                />

                Importar artículos
              </>
            )}
          </button>
        </footer>
      </div>
    </div>
  );
}