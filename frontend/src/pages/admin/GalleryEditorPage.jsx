import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  Link,
  useNavigate,
  useParams,
} from 'react-router-dom';

import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';

import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';

import {
  CSS,
} from '@dnd-kit/utilities';

import {
  ArrowLeft,
  Check,
  Copy,
  Edit3,
  Eye,
  FileImage,
  GripVertical,
  ImagePlus,
  Images,
  Link as LinkIcon,
  LoaderCircle,
  Plus,
  Save,
  Send,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';

import {
  createGallery,
  getGalleryById,
  publishGallery,
  updateGallery,
} from '../../api/galleries.api';

import {
  deleteUploadedFile,
  uploadFile,
  uploadFiles,
} from '../../api/admin.api';

import {
  getCollaborators,
} from '../../api/collaborators.api';

import {
  getEditions,
} from '../../api/editions.api';

import useAlert from '../../hooks/useAlert';
import useConfirm from '../../hooks/useConfirm';

import styles from './GalleryEditorPage.module.css';

const MAX_TECHNICAL_PHOTOS = 99;
const UPLOAD_BATCH_SIZE = 10;

const createLocalPhotoId = () => {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID ===
      'function'
  ) {
    return crypto.randomUUID();
  }

  return [
    'photo',
    Date.now(),
    Math.random()
      .toString(36)
      .slice(2),
  ].join('-');
};

const normalizeExternalUrl =
  value => {
    const url =
      String(value || '')
        .trim();

    if (!url) {
      return '';
    }

    if (
      /^https?:\/\//i.test(url)
    ) {
      return url;
    }

    return `https://${url}`;
  };

const getImageDimensions =
  url => {
    return new Promise(
      resolve => {
        const image =
          new Image();

        const timeout =
          window.setTimeout(
            () => {
              image.onload = null;
              image.onerror = null;

              resolve({
                width: null,
                height: null,
              });
            },
            8000
          );

        image.onload = () => {
          window.clearTimeout(
            timeout
          );

          resolve({
            width:
              image.naturalWidth ||
              null,

            height:
              image.naturalHeight ||
              null,
          });
        };

        image.onerror = () => {
          window.clearTimeout(
            timeout
          );

          resolve({
            width: null,
            height: null,
          });
        };

        image.src = url;
      }
    );
  };

const splitIntoBatches = (
  items,
  batchSize
) => {
  const batches = [];

  for (
    let index = 0;
    index < items.length;
    index += batchSize
  ) {
    batches.push(
      items.slice(
        index,
        index + batchSize
      )
    );
  }

  return batches;
};

const mapApiPhotoToEditorPhoto =
  photo => {
    return {
      localId:
        photo.id ||
        createLocalPhotoId(),

      id:
        photo.id ||
        null,

      image_url:
        photo.image_url ||
        '',

      image_key:
        photo.image_key ||
        null,

      title:
        photo.title ||
        '',

      description:
        photo.description ||
        '',

      photo_author:
        photo.photo_author ||
        '',

      alt_text:
        photo.alt_text ||
        '',

      width:
        photo.width ||
        null,

      height:
        photo.height ||
        null,
    };
  };

export default function GalleryEditorPage() {
  const {
    id,
  } = useParams();

  const navigate =
    useNavigate();

  const alert =
    useAlert();

  const confirm =
    useConfirm();

  const isEdit =
    Boolean(id);

  const [
    galleryId,
    setGalleryId,
  ] = useState(
    id || null
  );

  const [
    status,
    setStatus,
  ] = useState(
    'draft'
  );

  const [
    title,
    setTitle,
  ] = useState('');

  const [
    subtitle,
    setSubtitle,
  ] = useState('');

  const [
    excerpt,
    setExcerpt,
  ] = useState('');

  const [
    coverUrl,
    setCoverUrl,
  ] = useState('');

  const [
    coverKey,
    setCoverKey,
  ] = useState(null);

  const [
    collaboratorId,
    setCollaboratorId,
  ] = useState('');

  const [
    editionId,
    setEditionId,
  ] = useState('');

  const [
    editionOrder,
    setEditionOrder,
  ] = useState('');

  const [
    maxPhotos,
    setMaxPhotos,
  ] = useState(30);

  const [
    isFeatured,
    setIsFeatured,
  ] = useState(false);

  const [
    featuredOrder,
    setFeaturedOrder,
  ] = useState(1);

  const [
    museumSeed,
    setMuseumSeed,
  ] = useState('');

  const [
    photos,
    setPhotos,
  ] = useState([]);

  const [
    collaborators,
    setCollaborators,
  ] = useState([]);

  const [
    editions,
    setEditions,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    publishing,
    setPublishing,
  ] = useState(false);

  const [
    uploadingCover,
    setUploadingCover,
  ] = useState(false);

  const [
    uploadingPhotos,
    setUploadingPhotos,
  ] = useState(false);

  const [
    uploadProgress,
    setUploadProgress,
  ] = useState(0);

  const [
    coverUrlDialogOpen,
    setCoverUrlDialogOpen,
  ] = useState(false);

  const [
    coverUrlInput,
    setCoverUrlInput,
  ] = useState('');

  const [
    photoUrlDialogOpen,
    setPhotoUrlDialogOpen,
  ] = useState(false);

  const [
    photoUrlInput,
    setPhotoUrlInput,
  ] = useState('');

  const [
    previewOpen,
    setPreviewOpen,
  ] = useState(false);

  const loadedIdRef =
    useRef(null);

  const photoInputRef =
    useRef(null);

  const coverInputRef =
    useRef(null);

  const sensors =
    useSensors(
      useSensor(
        PointerSensor,
        {
          activationConstraint: {
            distance: 6,
          },
        }
      ),

      useSensor(
        KeyboardSensor,
        {
          coordinateGetter:
            sortableKeyboardCoordinates,
        }
      )
    );

  const selectedCollaborator =
    useMemo(() => {
      return (
        collaborators.find(
          collaborator =>
            String(
              collaborator.id
            ) ===
            String(
              collaboratorId
            )
        ) ||
        null
      );
    }, [
      collaborators,
      collaboratorId,
    ]);

  const remainingSlots =
    Math.max(
      0,
      Number(maxPhotos) -
      photos.length
    );

  useEffect(() => {
    let mounted = true;

    const loadInitialData =
      async () => {
        setLoading(true);

        try {
          const [
            collaboratorsData,
            editionsData,
          ] =
            await Promise.all([
              getCollaborators(),
              getEditions(),
            ]);

          if (!mounted) {
            return;
          }

          setCollaborators(
            Array.isArray(
              collaboratorsData
            )
              ? collaboratorsData
              : []
          );

          setEditions(
            Array.isArray(
              editionsData
            )
              ? editionsData
              : []
          );

          if (
            !isEdit ||
            !id ||
            loadedIdRef.current ===
              id
          ) {
            return;
          }

          const gallery =
            await getGalleryById(
              id
            );

          if (!mounted) {
            return;
          }

          loadedIdRef.current =
            id;

          setGalleryId(
            gallery.id ||
            id
          );

          setStatus(
            gallery.status ||
            'draft'
          );

          setTitle(
            gallery.title ||
            ''
          );

          setSubtitle(
            gallery.subtitle ||
            ''
          );

          setExcerpt(
            gallery.excerpt ||
            ''
          );

          setCoverUrl(
            gallery.cover_image_url ||
            ''
          );

          setCoverKey(
            gallery.cover_image_key ||
            null
          );

          setCollaboratorId(
            gallery.collaborator_id ||
            ''
          );

          setEditionId(
            gallery.edition_id ||
            ''
          );

          setEditionOrder(
            gallery.edition_order ??
            ''
          );

          setMaxPhotos(
            Number(
              gallery.max_photos ||
              30
            )
          );

          setIsFeatured(
            Boolean(
              gallery.is_featured
            )
          );

          setFeaturedOrder(
            Number(
              gallery.featured_order ||
              1
            )
          );

          setMuseumSeed(
            gallery.museum_seed ||
            ''
          );

          setPhotos(
            Array.isArray(
              gallery.gallery_photos
            )
              ? gallery
                  .gallery_photos
                  .map(
                    mapApiPhotoToEditorPhoto
                  )
              : []
          );
        } catch (error) {
          console.error(error);

          alert.error(
            'Error',
            error.response
              ?.data?.error ||
            'No se pudo cargar la galería'
          );
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      };

    loadInitialData();

    return () => {
      mounted = false;
    };
  }, [
    id,
    isEdit,
  ]);

  const validateBeforeSave =
    () => {
      if (!title.trim()) {
        alert.warning(
          'Falta el título',
          'Escribe el título del álbum'
        );

        return false;
      }

      if (!collaboratorId) {
        alert.warning(
          'Falta el autor',
          'Selecciona el colaborador responsable de la galería'
        );

        return false;
      }

      const normalizedMaximum =
        Number(maxPhotos);

      if (
        !Number.isInteger(
          normalizedMaximum
        ) ||
        normalizedMaximum < 1 ||
        normalizedMaximum >
          MAX_TECHNICAL_PHOTOS
      ) {
        alert.warning(
          'Límite inválido',
          'El máximo debe estar entre 1 y 99 fotografías'
        );

        return false;
      }

      if (
        photos.length >
        normalizedMaximum
      ) {
        alert.warning(
          'Demasiadas fotografías',
          `El álbum tiene ${photos.length} fotografías, pero el máximo actual es ${normalizedMaximum}`
        );

        return false;
      }

      return true;
    };

  const buildPayload = () => {
    return {
      title:
        title.trim(),

      subtitle:
        subtitle.trim() ||
        null,

      excerpt:
        excerpt.trim() ||
        null,

      cover_image_url:
        coverUrl.trim() ||
        null,

      cover_image_key:
        coverKey ||
        null,

      collaborator_id:
        collaboratorId,

      edition_id:
        editionId ||
        null,

      edition_order:
        editionId &&
        Number.isInteger(
          Number(
            editionOrder
          )
        ) &&
        Number(
          editionOrder
        ) > 0
          ? Number(
              editionOrder
            )
          : null,

      max_photos:
        Number(maxPhotos),

      is_featured:
        isFeatured,

      featured_order:
        isFeatured
          ? Number(
              featuredOrder ||
              0
            )
          : null,

      museum_seed:
        museumSeed.trim() ||
        null,

      photos:
        photos.map(
          (
            photo,
            index
          ) => ({
            image_url:
              photo.image_url,

            image_key:
              photo.image_key ||
              null,

            title:
              photo.title.trim() ||
              null,

            description:
              photo.description
                .trim() ||
              null,

            photo_author:
              photo.photo_author
                .trim() ||
              null,

            alt_text:
              photo.alt_text
                .trim() ||
              null,

            width:
              photo.width ||
              null,

            height:
              photo.height ||
              null,

            display_order:
              index,
          })
        ),
    };
  };

  const handleSave =
    async ({
      silent = false,
    } = {}) => {
      if (
        !validateBeforeSave()
      ) {
        return null;
      }

      setSaving(true);

      try {
        const payload =
          buildPayload();

        if (galleryId) {
          const result =
            await updateGallery(
              galleryId,
              payload
            );

          if (!silent) {
            alert.success(
              'Galería guardada',
              'Los cambios se guardaron correctamente'
            );
          }

          return result;
        }

        const result =
          await createGallery(
            payload
          );

        const newId =
          result?.id;

        if (!newId) {
          throw new Error(
            'La API no devolvió el ID de la galería'
          );
        }

        setGalleryId(
          newId
        );

        setStatus(
          result.status ||
          'draft'
        );

        if (!silent) {
          alert.success(
            'Borrador creado',
            'La galería se guardó correctamente'
          );
        }

        navigate(
          `/admin/galerias/editar/${newId}`,
          {
            replace: true,
          }
        );

        return result;
      } catch (error) {
        console.error(error);

        alert.error(
          'No se pudo guardar',
          error.response
            ?.data?.error ||
          error.message ||
          'Ocurrió un error guardando la galería'
        );

        return null;
      } finally {
        setSaving(false);
      }
    };

  const handlePublish =
    async () => {
      if (
        !validateBeforeSave()
      ) {
        return;
      }

      if (!coverUrl) {
        alert.warning(
          'Falta la portada',
          'Agrega una portada antes de publicar'
        );

        return;
      }

      if (
        photos.length === 0
      ) {
        alert.warning(
          'Galería vacía',
          'Agrega al menos una fotografía antes de publicar'
        );

        return;
      }

      const accepted =
        await confirm({
          type: 'info',

          title:
            '¿Publicar esta galería?',

          message:
            'El álbum quedará visible para todos los lectores.',

          confirmLabel:
            'Sí, publicar',
        });

      if (!accepted) {
        return;
      }

      setPublishing(true);

      try {
        let targetId =
          galleryId;

        const saved =
          await handleSave({
            silent: true,
          });

        if (!saved) {
          return;
        }

        targetId =
          saved.id ||
          targetId;

        if (!targetId) {
          throw new Error(
            'No fue posible identificar la galería'
          );
        }

        await publishGallery(
          targetId
        );

        setStatus(
          'published'
        );

        alert.success(
          'Galería publicada',
          'El álbum ya está disponible públicamente'
        );
      } catch (error) {
        console.error(error);

        alert.error(
          'No se pudo publicar',
          error.response
            ?.data?.error ||
          error.message ||
          'Ocurrió un error publicando la galería'
        );
      } finally {
        setPublishing(false);
      }
    };

  const handleCoverUpload =
    async event => {
      const file =
        event.target
          .files?.[0];

      if (!file) {
        return;
      }

      setUploadingCover(true);

      try {
        const result =
          await uploadFile(
            file,
            'galleries/covers'
          );

        if (
          coverKey &&
          coverKey !==
            result.key
        ) {
          deleteUploadedFile(
            coverKey
          ).catch(() => {});
        }

        setCoverUrl(
          result.url
        );

        setCoverKey(
          result.key ||
          null
        );

        alert.success(
          'Portada subida',
          'La portada se agregó correctamente'
        );
      } catch (error) {
        console.error(error);

        alert.error(
          'Error',
          error.response
            ?.data?.error ||
          'No se pudo subir la portada'
        );
      } finally {
        setUploadingCover(false);

        event.target.value =
          '';
      }
    };

  const handleCoverUrlSubmit =
    async event => {
      event.preventDefault();

      const url =
        normalizeExternalUrl(
          coverUrlInput
        );

      if (!url) {
        alert.warning(
          'URL requerida',
          'Escribe la URL de la portada'
        );

        return;
      }

      const dimensions =
        await getImageDimensions(
          url
        );

      if (
        !dimensions.width ||
        !dimensions.height
      ) {
        alert.warning(
          'Imagen no disponible',
          'No fue posible cargar la imagen desde esa URL'
        );

        return;
      }

      if (coverKey) {
        deleteUploadedFile(
          coverKey
        ).catch(() => {});
      }

      setCoverUrl(url);
      setCoverKey(null);
      setCoverUrlInput('');
      setCoverUrlDialogOpen(false);

      alert.success(
        'Portada agregada',
        'La portada externa se agregó correctamente'
      );
    };

  const removeCover =
    async () => {
      const accepted =
        await confirm({
          type: 'danger',

          title:
            '¿Quitar la portada?',

          message:
            'La galería quedará sin imagen de portada.',

          confirmLabel:
            'Sí, quitar',
        });

      if (!accepted) {
        return;
      }

      if (coverKey) {
        try {
          await deleteUploadedFile(
            coverKey
          );
        } catch {
          // La portada se quita del formulario
          // aunque el archivo remoto no pueda eliminarse.
        }
      }

      setCoverUrl('');
      setCoverKey(null);
    };

  const handlePhotoFiles =
    async event => {
      const selectedFiles =
        Array.from(
          event.target
            .files ||
          []
        );

      event.target.value =
        '';

      if (
        selectedFiles.length === 0
      ) {
        return;
      }

      if (
        selectedFiles.length >
        remainingSlots
      ) {
        alert.warning(
          'Límite excedido',
          `Solo puedes agregar ${remainingSlots} fotografías más`
        );

        return;
      }

      setUploadingPhotos(true);
      setUploadProgress(0);

      try {
        const batches =
          splitIntoBatches(
            selectedFiles,
            UPLOAD_BATCH_SIZE
          );

        const uploadedPhotos =
          [];

        for (
          let batchIndex = 0;
          batchIndex <
          batches.length;
          batchIndex += 1
        ) {
          const batch =
            batches[
              batchIndex
            ];

          const batchResult =
            await uploadFiles(
              batch,
              'galleries/photos',
              batchProgress => {
                const baseProgress =
                  (
                    batchIndex /
                    batches.length
                  ) *
                  100;

                const batchShare =
                  100 /
                  batches.length;

                const totalProgress =
                  Math.round(
                    baseProgress +
                    (
                      batchProgress /
                      100
                    ) *
                    batchShare
                  );

                setUploadProgress(
                  totalProgress
                );
              }
            );

          const normalizedResults =
            Array.isArray(
              batchResult
            )
              ? batchResult
              : [];

          for (
            const uploaded of
            normalizedResults
          ) {
            const dimensions =
              await getImageDimensions(
                uploaded.url
              );

            uploadedPhotos.push({
              localId:
                createLocalPhotoId(),

              id:
                null,

              image_url:
                uploaded.url,

              image_key:
                uploaded.key ||
                null,

              title:
                uploaded.name
                  ?.replace(
                    /\.[^.]+$/,
                    ''
                  ) ||
                '',

              description:
                '',

              photo_author:
                selectedCollaborator
                  ?.name ||
                '',

              alt_text:
                '',

              width:
                dimensions.width,

              height:
                dimensions.height,
            });
          }
        }

        setPhotos(
          current => [
            ...current,
            ...uploadedPhotos,
          ]
        );

        setUploadProgress(100);

        alert.success(
          'Fotografías subidas',
          `${uploadedPhotos.length} fotografías se agregaron al álbum`
        );
      } catch (error) {
        console.error(error);

        alert.error(
          'Error de subida',
          error.response
            ?.data?.error ||
          'No se pudieron subir las fotografías'
        );
      } finally {
        setUploadingPhotos(false);

        window.setTimeout(
          () => {
            setUploadProgress(0);
          },
          500
        );
      }
    };

  const handlePhotoUrlSubmit =
    async event => {
      event.preventDefault();

      if (
        remainingSlots <= 0
      ) {
        alert.warning(
          'Álbum completo',
          'La galería ya alcanzó el máximo de fotografías'
        );

        return;
      }

      const url =
        normalizeExternalUrl(
          photoUrlInput
        );

      if (!url) {
        alert.warning(
          'URL requerida',
          'Escribe la URL de la fotografía'
        );

        return;
      }

      const dimensions =
        await getImageDimensions(
          url
        );

      if (
        !dimensions.width ||
        !dimensions.height
      ) {
        alert.warning(
          'Imagen no disponible',
          'No fue posible cargar la fotografía desde esa URL'
        );

        return;
      }

      setPhotos(
        current => [
          ...current,

          {
            localId:
              createLocalPhotoId(),

            id:
              null,

            image_url:
              url,

            image_key:
              null,

            title:
              '',

            description:
              '',

            photo_author:
              selectedCollaborator
                ?.name ||
              '',

            alt_text:
              '',

            width:
              dimensions.width,

            height:
              dimensions.height,
          },
        ]
      );

      setPhotoUrlInput('');
      setPhotoUrlDialogOpen(false);

      alert.success(
        'Fotografía agregada',
        'La imagen externa se agregó al álbum'
      );
    };

  const updatePhoto = (
    localId,
    field,
    value
  ) => {
    setPhotos(
      current =>
        current.map(
          photo =>
            photo.localId ===
            localId
              ? {
                  ...photo,
                  [field]:
                    value,
                }
              : photo
        )
    );
  };

  const duplicatePhoto =
    photo => {
      if (
        remainingSlots <= 0
      ) {
        alert.warning(
          'Álbum completo',
          'No hay espacio para duplicar la fotografía'
        );

        return;
      }

      setPhotos(
        current => {
          const sourceIndex =
            current.findIndex(
              item =>
                item.localId ===
                photo.localId
            );

          if (
            sourceIndex === -1
          ) {
            return current;
          }

          const duplicate = {
            ...photo,

            localId:
              createLocalPhotoId(),

            id:
              null,

            title:
              photo.title
                ? `${photo.title} copia`
                : '',
          };

          const next = [
            ...current,
          ];

          next.splice(
            sourceIndex + 1,
            0,
            duplicate
          );

          return next;
        }
      );
    };

  const removePhoto =
    async photo => {
      const accepted =
        await confirm({
          type: 'danger',

          title:
            '¿Eliminar esta fotografía?',

          message:
            'La imagen se retirará del álbum.',

          confirmLabel:
            'Sí, eliminar',
        });

      if (!accepted) {
        return;
      }

      if (photo.image_key) {
        try {
          await deleteUploadedFile(
            photo.image_key
          );
        } catch {
          // Permitimos retirar la fotografía del editor
          // aunque falle la limpieza remota.
        }
      }

      setPhotos(
        current =>
          current.filter(
            item =>
              item.localId !==
              photo.localId
          )
      );
    };

  const handleDragEnd =
    event => {
      const {
        active,
        over,
      } = event;

      if (
        !over ||
        active.id === over.id
      ) {
        return;
      }

      setPhotos(
        current => {
          const oldIndex =
            current.findIndex(
              photo =>
                photo.localId ===
                active.id
            );

          const newIndex =
            current.findIndex(
              photo =>
                photo.localId ===
                over.id
            );

          if (
            oldIndex === -1 ||
            newIndex === -1
          ) {
            return current;
          }

          return arrayMove(
            current,
            oldIndex,
            newIndex
          );
        }
      );
    };

  const regenerateMuseumSeed =
    () => {
      const nextSeed =
        [
          title
            .trim()
            .toLocaleLowerCase(
              'es-MX'
            )
            .replace(
              /\s+/g,
              '-'
            ) ||
            'galeria',

          Date.now(),

          Math.random()
            .toString(36)
            .slice(2, 8),
        ].join('-');

      setMuseumSeed(
        nextSeed
      );

      alert.success(
        'Museo regenerado',
        'Se creó una nueva semilla para la distribución 3D'
      );
    };

  if (loading) {
    return (
      <EditorLoading />
    );
  }

  return (
    <div
      className={
        styles.page
      }
    >
      <header
        className={
          styles.topBar
        }
      >
        <div
          className={
            styles.topLeft
          }
        >
          <Link
            to="/admin/galerias"
            className={
              styles.backButton
            }
          >
            <ArrowLeft
              size={15}
            />

            Galerías
          </Link>

          <span
            className={
              styles.statusBadge
            }
            data-status={
              status
            }
          >
            {status ===
            'published'
              ? 'Publicada'
              : status ===
                  'archived'
                ? 'Archivada'
                : 'Borrador'}
          </span>
        </div>

        <div
          className={
            styles.topActions
          }
        >
          <button
            type="button"
            onClick={() => {
              setPreviewOpen(
                current =>
                  !current
              );
            }}
            className={
              styles.previewButton
            }
          >
            <Eye size={15} />

            {previewOpen
              ? 'Editar'
              : 'Vista previa'}
          </button>

          <button
            type="button"
            onClick={() => {
              handleSave();
            }}
            disabled={
              saving ||
              publishing
            }
            className={
              styles.saveButton
            }
          >
            {saving ? (
              <LoaderCircle
                size={15}
                className={
                  styles.spinning
                }
              />
            ) : (
              <Save
                size={15}
              />
            )}

            {saving
              ? 'Guardando...'
              : 'Guardar borrador'}
          </button>

          {status !==
            'published' && (
            <button
              type="button"
              onClick={
                handlePublish
              }
              disabled={
                saving ||
                publishing
              }
              className={
                styles.publishButton
              }
            >
              {publishing ? (
                <LoaderCircle
                  size={15}
                  className={
                    styles.spinning
                  }
                />
              ) : (
                <Send
                  size={15}
                />
              )}

              {publishing
                ? 'Publicando...'
                : 'Publicar'}
            </button>
          )}
        </div>
      </header>

      {previewOpen ? (
        <GalleryPreview
          title={title}
          subtitle={subtitle}
          excerpt={excerpt}
          coverUrl={coverUrl}
          photos={photos}
          collaborator={
            selectedCollaborator
          }
        />
      ) : (
        <div
          className={
            styles.layout
          }
        >
          <main
            className={
              styles.mainColumn
            }
          >
            <section
              className={
                styles.editorHeader
              }
            >
              <div
                className={
                  styles.editorEyebrow
                }
              >
                Álbum fotográfico
              </div>

              <input
                type="text"
                value={title}
                onChange={event => {
                  setTitle(
                    event.target
                      .value
                  );
                }}
                className={
                  styles.titleInput
                }
                placeholder="Título de la galería..."
              />

              <input
                type="text"
                value={subtitle}
                onChange={event => {
                  setSubtitle(
                    event.target
                      .value
                  );
                }}
                className={
                  styles.subtitleInput
                }
                placeholder="Subtítulo opcional..."
              />

              <textarea
                value={excerpt}
                onChange={event => {
                  setExcerpt(
                    event.target
                      .value
                  );
                }}
                className={
                  styles.excerptInput
                }
                placeholder="Breve introducción o descripción general del álbum..."
                rows={3}
              />
            </section>

            <section
              className={
                styles.photoSection
              }
            >
              <div
                className={
                  styles.photoSectionHeader
                }
              >
                <div>
                  <div
                    className={
                      styles.sectionLabel
                    }
                  >
                    Fotografías
                  </div>

                  <h2>
                    Álbum
                  </h2>

                  <p>
                    Arrastra las
                    fotografías para
                    cambiar el orden.
                  </p>
                </div>

                <div
                  className={
                    styles.photoCounter
                  }
                >
                  <strong>
                    {photos.length}
                  </strong>

                  <span>
                    de {maxPhotos}
                  </span>
                </div>
              </div>

              <div
                className={
                  styles.uploadToolbar
                }
              >
                <button
                  type="button"
                  onClick={() => {
                    photoInputRef
                      .current
                      ?.click();
                  }}
                  disabled={
                    uploadingPhotos ||
                    remainingSlots <=
                      0
                  }
                  className={
                    styles.uploadPrimary
                  }
                >
                  <Upload
                    size={16}
                  />

                  Subir fotografías
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPhotoUrlInput(
                      ''
                    );

                    setPhotoUrlDialogOpen(
                      true
                    );
                  }}
                  disabled={
                    remainingSlots <=
                    0
                  }
                  className={
                    styles.uploadSecondary
                  }
                >
                  <LinkIcon
                    size={15}
                  />

                  Agregar por URL
                </button>

                <input
                  ref={
                    photoInputRef
                  }
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                  multiple
                  hidden
                  onChange={
                    handlePhotoFiles
                  }
                />

                <div
                  className={
                    styles.remainingSlots
                  }
                >
                  {remainingSlots > 0
                    ? `${remainingSlots} espacios disponibles`
                    : 'Álbum completo'}
                </div>
              </div>

              {uploadingPhotos && (
                <div
                  className={
                    styles.uploadProgress
                  }
                >
                  <div
                    className={
                      styles.uploadProgressHeader
                    }
                  >
                    <span>
                      Subiendo fotografías
                    </span>

                    <strong>
                      {uploadProgress}%
                    </strong>
                  </div>

                  <div
                    className={
                      styles.uploadProgressTrack
                    }
                  >
                    <span
                      style={{
                        width:
                          `${uploadProgress}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {photos.length ===
                0 ? (
                <div
                  className={
                    styles.emptyAlbum
                  }
                >
                  <Images
                    size={44}
                  />

                  <h3>
                    El álbum está vacío
                  </h3>

                  <p>
                    Sube fotografías o
                    agrégalas mediante
                    una URL externa.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      photoInputRef
                        .current
                        ?.click();
                    }}
                  >
                    <ImagePlus
                      size={16}
                    />

                    Agregar fotografías
                  </button>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={
                    closestCenter
                  }
                  onDragEnd={
                    handleDragEnd
                  }
                >
                  <SortableContext
                    items={photos.map(
                      photo =>
                        photo.localId
                    )}
                    strategy={
                      rectSortingStrategy
                    }
                  >
                    <div
                      className={
                        styles.photoGrid
                      }
                    >
                      {photos.map(
                        (
                          photo,
                          index
                        ) => (
                          <SortablePhotoCard
                            key={
                              photo.localId
                            }
                            photo={
                              photo
                            }
                            index={
                              index
                            }
                            onChange={
                              updatePhoto
                            }
                            onDuplicate={
                              duplicatePhoto
                            }
                            onRemove={
                              removePhoto
                            }
                          />
                        )
                      )}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </section>
          </main>

          <aside
            className={
              styles.sidebar
            }
          >
            <section
              className={
                styles.panel
              }
            >
              <div
                className={
                  styles.panelTitle
                }
              >
                Portada
              </div>

              {coverUrl ? (
                <div
                  className={
                    styles.coverPreview
                  }
                >
                  <img
                    src={coverUrl}
                    alt={
                      title ||
                      'Portada'
                    }
                  />

                  <button
                    type="button"
                    onClick={
                      removeCover
                    }
                    className={
                      styles.coverRemove
                    }
                    title="Quitar portada"
                  >
                    <Trash2
                      size={14}
                    />
                  </button>
                </div>
              ) : (
                <div
                  className={
                    styles.coverEmpty
                  }
                >
                  <FileImage
                    size={30}
                  />

                  <span>
                    Sin portada
                  </span>
                </div>
              )}

              <div
                className={
                  styles.coverActions
                }
              >
                <button
                  type="button"
                  disabled={
                    uploadingCover
                  }
                  onClick={() => {
                    coverInputRef
                      .current
                      ?.click();
                  }}
                >
                  {uploadingCover ? (
                    <LoaderCircle
                      size={14}
                      className={
                        styles.spinning
                      }
                    />
                  ) : (
                    <Upload
                      size={14}
                    />
                  )}

                  Subir
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCoverUrlInput(
                      ''
                    );

                    setCoverUrlDialogOpen(
                      true
                    );
                  }}
                >
                  <LinkIcon
                    size={14}
                  />

                  URL
                </button>

                <input
                  ref={
                    coverInputRef
                  }
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                  hidden
                  onChange={
                    handleCoverUpload
                  }
                />
              </div>
            </section>

            <section
              className={
                styles.panel
              }
            >
              <div
                className={
                  styles.panelTitle
                }
              >
                Publicación
              </div>

              <label
                className={
                  styles.field
                }
              >
                <span>
                  Autor
                </span>

                <select
                  value={
                    collaboratorId
                  }
                  onChange={event => {
                    setCollaboratorId(
                      event.target
                        .value
                    );
                  }}
                >
                  <option value="">
                    Selecciona un colaborador
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
                        {collaborator.type ===
                        'occasional'
                          ? ' · Ocasional'
                          : ' · Fijo'}
                      </option>
                    )
                  )}
                </select>
              </label>

              <label
                className={
                  styles.field
                }
              >
                <span>
                  Edición
                </span>

                <select
                  value={
                    editionId
                  }
                  onChange={event => {
                    const nextEditionId =
                      event.target.value;

                    setEditionId(
                      nextEditionId
                    );

                    if (!nextEditionId) {
                      setEditionOrder('');
                    }
                  }}
                >
                  <option value="">
                    Sin edición
                  </option>

                  {editions.map(
                    edition => (
                      <option
                        key={
                          edition.id
                        }
                        value={
                          edition.id
                        }
                      >
                        {edition.is_special
                          ? 'Especial'
                          : `Edición ${edition.number}`
                        }

                        {edition.name
                          ? ` · ${edition.name}`
                          : ''}
                      </option>
                    )
                  )}
                </select>
              </label>

              {editionId && (
                <label
                  className={
                    styles.field
                  }
                >
                  <span>
                    Orden dentro de la edición
                  </span>

                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={
                      editionOrder
                    }
                    onChange={event => {
                      setEditionOrder(
                        event.target
                          .value
                      );
                    }}
                    placeholder="Ej. 1"
                  />
                </label>
              )}

              <label
                className={
                  styles.field
                }
              >
                <span>
                  Máximo de fotografías
                </span>

                <input
                  type="number"
                  min="1"
                  max={
                    MAX_TECHNICAL_PHOTOS
                  }
                  value={
                    maxPhotos
                  }
                  onChange={event => {
                    const next =
                      Number(
                        event.target
                          .value
                      );

                    setMaxPhotos(
                      Number.isFinite(
                        next
                      )
                        ? next
                        : 1
                    );
                  }}
                />
              </label>
            </section>

            <section
              className={
                styles.panel
              }
            >
              <div
                className={
                  styles.panelTitle
                }
              >
                Destacado
              </div>

              <label
                className={
                  styles.checkField
                }
              >
                <input
                  type="checkbox"
                  checked={
                    isFeatured
                  }
                  onChange={event => {
                    setIsFeatured(
                      event.target
                        .checked
                    );
                  }}
                />

                <span
                  className={
                    styles.customCheck
                  }
                >
                  {isFeatured && (
                    <Check
                      size={13}
                    />
                  )}
                </span>

                <div>
                  <strong>
                    Mostrar en highlights
                  </strong>

                  <small>
                    Disponible para la portada principal.
                  </small>
                </div>
              </label>

              {isFeatured && (
                <label
                  className={
                    styles.field
                  }
                >
                  <span>
                    Orden
                  </span>

                  <input
                    type="number"
                    min="1"
                    max="4"
                    value={
                      featuredOrder
                    }
                    onChange={event => {
                      setFeaturedOrder(
                        Number(
                          event.target
                            .value
                        )
                      );
                    }}
                  />
                </label>
              )}
            </section>

            <section
              className={
                styles.panel
              }
            >
              <div
                className={
                  styles.panelTitle
                }
              >
                Museo 3D
              </div>

              <p
                className={
                  styles.panelDescription
                }
              >
                La semilla mantiene la
                misma arquitectura para
                todos los visitantes.
              </p>

              <label
                className={
                  styles.field
                }
              >
                <span>
                  Semilla procedural
                </span>

                <input
                  type="text"
                  value={
                    museumSeed
                  }
                  onChange={event => {
                    setMuseumSeed(
                      event.target
                        .value
                    );
                  }}
                  placeholder="Se genera automáticamente"
                />
              </label>

              <button
                type="button"
                className={
                  styles.regenerateButton
                }
                onClick={
                  regenerateMuseumSeed
                }
              >
                <Sparkles
                  size={14}
                />

                Regenerar museo
              </button>
            </section>
          </aside>
        </div>
      )}

      {coverUrlDialogOpen && (
        <UrlDialog
          title="Agregar portada por URL"
          message="Pega un enlace directo a una imagen."
          value={
            coverUrlInput
          }
          onChange={
            setCoverUrlInput
          }
          onClose={() => {
            setCoverUrlDialogOpen(
              false
            );
          }}
          onSubmit={
            handleCoverUrlSubmit
          }
        />
      )}

      {photoUrlDialogOpen && (
        <UrlDialog
          title="Agregar fotografía por URL"
          message="Pega un enlace directo a la fotografía."
          value={
            photoUrlInput
          }
          onChange={
            setPhotoUrlInput
          }
          onClose={() => {
            setPhotoUrlDialogOpen(
              false
            );
          }}
          onSubmit={
            handlePhotoUrlSubmit
          }
        />
      )}
    </div>
  );
}

function SortablePhotoCard({
  photo,
  index,
  onChange,
  onDuplicate,
  onRemove,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id:
      photo.localId,
  });

  return (
    <article
      ref={setNodeRef}
      style={{
        transform:
          CSS.Transform.toString(
            transform
          ),

        transition,
      }}
      className={`
        ${styles.photoCard}
        ${
          isDragging
            ? styles.photoCardDragging
            : ''
        }
      `}
    >
      <div
        className={
          styles.photoMedia
        }
      >
        <img
          src={
            photo.image_url
          }
          alt={
            photo.alt_text ||
            photo.title ||
            `Fotografía ${index + 1}`
          }
        />

        <span
          className={
            styles.photoNumber
          }
        >
          {String(
            index + 1
          ).padStart(2, '0')}
        </span>

        <button
          type="button"
          className={
            styles.dragHandle
          }
          title="Arrastrar para reordenar"
          {...attributes}
          {...listeners}
        >
          <GripVertical
            size={17}
          />
        </button>
      </div>

      <div
        className={
          styles.photoFields
        }
      >
        <label>
          <span>
            Título
          </span>

          <input
            type="text"
            value={
              photo.title
            }
            onChange={event => {
              onChange(
                photo.localId,
                'title',
                event.target
                  .value
              );
            }}
            placeholder="Título de la fotografía"
          />
        </label>

        <label>
          <span>
            Descripción
          </span>

          <textarea
            value={
              photo.description
            }
            onChange={event => {
              onChange(
                photo.localId,
                'description',
                event.target
                  .value
              );
            }}
            placeholder="Breve descripción..."
            rows={3}
          />
        </label>

        <div
          className={
            styles.photoFieldRow
          }
        >
          <label>
            <span>
              Autor
            </span>

            <input
              type="text"
              value={
                photo.photo_author
              }
              onChange={event => {
                onChange(
                  photo.localId,
                  'photo_author',
                  event.target
                    .value
                );
              }}
              placeholder="Fotógrafo/a"
            />
          </label>

          <label>
            <span>
              Texto alternativo
            </span>

            <input
              type="text"
              value={
                photo.alt_text
              }
              onChange={event => {
                onChange(
                  photo.localId,
                  'alt_text',
                  event.target
                    .value
                );
              }}
              placeholder="Describe la imagen"
            />
          </label>
        </div>

        <div
          className={
            styles.photoCardFooter
          }
        >
          <span>
            {photo.width &&
            photo.height
              ? `${photo.width} × ${photo.height}`
              : 'Dimensiones no detectadas'}
          </span>

          <div>
            <button
              type="button"
              onClick={() => {
                onDuplicate(
                  photo
                );
              }}
              title="Duplicar"
            >
              <Copy
                size={14}
              />
            </button>

            <button
              type="button"
              onClick={() => {
                onRemove(
                  photo
                );
              }}
              className={
                styles.photoDelete
              }
              title="Eliminar"
            >
              <Trash2
                size={14}
              />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function UrlDialog({
  title,
  message,
  value,
  onChange,
  onClose,
  onSubmit,
}) {
  return (
    <div
      className={
        styles.dialogBackdrop
      }
      role="presentation"
      onMouseDown={event => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <form
        className={
          styles.dialog
        }
        onSubmit={
          onSubmit
        }
      >
        <div
          className={
            styles.dialogHeader
          }
        >
          <div
            className={
              styles.dialogIcon
            }
          >
            <LinkIcon
              size={20}
            />
          </div>

          <div>
            <div
              className={
                styles.dialogEyebrow
              }
            >
              Imagen externa
            </div>

            <h2>
              {title}
            </h2>

            <p>
              {message}
            </p>
          </div>

          <button
            type="button"
            className={
              styles.dialogClose
            }
            onClick={
              onClose
            }
          >
            <X size={18} />
          </button>
        </div>

        <input
          type="url"
          value={value}
          onChange={event => {
            onChange(
              event.target.value
            );
          }}
          placeholder="https://..."
          autoFocus
          className={
            styles.dialogInput
          }
        />

        <div
          className={
            styles.dialogActions
          }
        >
          <button
            type="button"
            onClick={
              onClose
            }
          >
            Cancelar
          </button>

          <button
            type="submit"
            className={
              styles.dialogConfirm
            }
          >
            <Plus
              size={14}
            />

            Agregar imagen
          </button>
        </div>
      </form>
    </div>
  );
}

function GalleryPreview({
  title,
  subtitle,
  excerpt,
  coverUrl,
  photos,
  collaborator,
}) {
  return (
    <div
      className={
        styles.preview
      }
    >
      <div
        className={
          styles.previewHeader
        }
      >
        <div
          className={
            styles.previewEyebrow
          }
        >
          Vista previa
        </div>

        <h1>
          {title ||
            'Título de la galería'}
        </h1>

        {subtitle && (
          <p
            className={
              styles.previewSubtitle
            }
          >
            {subtitle}
          </p>
        )}

        <div
          className={
            styles.previewMeta
          }
        >
          <span>
            {collaborator
              ?.name ||
              'Sin autor'}
          </span>

          <span>·</span>

          <span>
            {photos.length}{' '}
            {photos.length === 1
              ? 'fotografía'
              : 'fotografías'}
          </span>
        </div>
      </div>

      {coverUrl && (
        <div
          className={
            styles.previewCover
          }
        >
          <img
            src={coverUrl}
            alt={
              title ||
              'Portada'
            }
          />
        </div>
      )}

      {excerpt && (
        <p
          className={
            styles.previewExcerpt
          }
        >
          {excerpt}
        </p>
      )}

      <div
        className={
          styles.previewPhotoGrid
        }
      >
        {photos.map(
          (
            photo,
            index
          ) => (
            <figure
              key={
                photo.localId
              }
              className={
                styles.previewPhoto
              }
            >
              <img
                src={
                  photo.image_url
                }
                alt={
                  photo.alt_text ||
                  photo.title ||
                  ''
                }
              />

              <figcaption>
                <strong>
                  {photo.title ||
                    `Fotografía ${index + 1}`}
                </strong>

                {photo.description && (
                  <span>
                    {
                      photo.description
                    }
                  </span>
                )}
              </figcaption>
            </figure>
          )
        )}
      </div>
    </div>
  );
}

function EditorLoading() {
  return (
    <div
      className={
        styles.loading
      }
    >
      <LoaderCircle
        size={32}
        className={
          styles.spinning
        }
      />

      <span>
        Cargando galería...
      </span>
    </div>
  );
}