import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import Color from '@tiptap/extension-color';
import { Extension } from '@tiptap/core';

import {
  createArticle,
  updateArticle,
  getArticleById,
  publishArticle,
} from '../../api/articles.api';

import { getCategories } from '../../api/categories.api';
import { getCollaborators } from '../../api/collaborators.api';
import { getEditions } from '../../api/editions.api';
import { uploadFile } from '../../api/admin.api';

import useAlert from '../../hooks/useAlert';

import ResizableImage from './editor/ResizableImage.js';
import MediaEmbed from './editor/MediaEmbed.js';

import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Minus,
  Link as LinkIcon,
  Unlink,
  Image as ImageIcon,
  Video,
  Undo,
  Redo,
  Eye,
  Save,
  Send,
  X,
  Upload,
  CaseUpper,
  CaseLower,
  CaseSensitive,
  RotateCcw,
} from 'lucide-react';

import styles from './ArticleEditorPage.module.css';

const FONT_FAMILIES = [
  {
    label: 'Aptos',
    value: 'Aptos, Arial, sans-serif',
  },
  {
    label: 'Arial',
    value: 'Arial, sans-serif',
  },
  {
    label: 'Calibri',
    value: 'Calibri, Arial, sans-serif',
  },
  {
    label: 'Cambria',
    value: 'Cambria, Georgia, serif',
  },
  {
    label: 'Georgia',
    value: 'Georgia, serif',
  },
  {
    label: 'Garamond',
    value: 'Garamond, serif',
  },
  {
    label: 'Times New Roman',
    value: '"Times New Roman", serif',
  },
  {
    label: 'Verdana',
    value: 'Verdana, sans-serif',
  },
  {
    label: 'Helvetica',
    value: 'Helvetica, Arial, sans-serif',
  },
  {
    label: 'Trebuchet MS',
    value: '"Trebuchet MS", sans-serif',
  },
  {
    label: 'Courier New',
    value: '"Courier New", monospace',
  },
];

const FONT_SIZES = [
  8,
  9,
  10,
  11,
  12,
  14,
  16,
  18,
  20,
  24,
  28,
  32,
  36,
  48,
  60,
  72,
];

const FontSize = Extension.create({
  name: 'fontSize',

  addOptions() {
    return {
      types: ['textStyle'],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,

        attributes: {
          fontSize: {
            default: null,

            parseHTML: element => {
              return (
                element.style.fontSize ||
                null
              );
            },

            renderHTML: attributes => {
              if (!attributes.fontSize) {
                return {};
              }

              return {
                style: `font-size: ${attributes.fontSize}`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setFontSize:
        fontSize =>
        ({ chain }) => {
          return chain()
            .setMark('textStyle', {
              fontSize,
            })
            .run();
        },

      unsetFontSize:
        () =>
        ({ chain }) => {
          return chain()
            .setMark('textStyle', {
              fontSize: null,
            })
            .removeEmptyTextStyle()
            .run();
        },
    };
  },
});

const ListStyleAttributes = Extension.create({
  name: 'listStyleAttributes',

  addGlobalAttributes() {
    return [
      {
        types: ['orderedList', 'bulletList'],

        attributes: {
          listStyleType: {
            default: null,

            parseHTML: element => {
              return element.style.listStyleType || null;
            },

            renderHTML: attributes => {
              if (!attributes.listStyleType) {
                return {};
              }

              return {
                style: `list-style-type:${attributes.listStyleType}`,
              };
            },
          },
        },
      },
    ];
  },
});

const normalizeUrl = value => {
  const url = String(value || '').trim();

  if (!url) {
    return '';
  }

  if (/^(https?:|mailto:|tel:)/i.test(url)) {
    return url;
  }

  return `https://${url}`;
};

const parseMediaUrl = rawUrl => {
  const originalUrl = normalizeUrl(rawUrl);

  if (!originalUrl) {
    throw new Error('La URL está vacía');
  }

  const youtubePatterns = [
    /youtube\.com\/watch\?.*v=([^&]+)/i,
    /youtu\.be\/([^?&/]+)/i,
    /youtube\.com\/shorts\/([^?&/]+)/i,
    /youtube\.com\/embed\/([^?&/]+)/i,
  ];

  for (const pattern of youtubePatterns) {
    const match = originalUrl.match(pattern);

    if (match?.[1]) {
      return {
        provider: 'youtube',
        src: `https://www.youtube-nocookie.com/embed/${match[1]}`,
        originalUrl,
        title: 'Video de YouTube',
      };
    }
  }

  const tiktokMatch = originalUrl.match(
    /tiktok\.com\/.*\/video\/(\d+)/i
  );

  if (tiktokMatch?.[1]) {
    return {
      provider: 'tiktok',
      src: `https://www.tiktok.com/player/v1/${tiktokMatch[1]}?autoplay=0`,
      originalUrl,
      title: 'Video de TikTok',
    };
  }

  const instagramMatch = originalUrl.match(
    /instagram\.com\/(?:p|reel|tv)\/([^?/#]+)/i
  );

  if (instagramMatch?.[1]) {
    return {
      provider: 'instagram',
      src: `https://www.instagram.com/p/${instagramMatch[1]}/embed/`,
      originalUrl,
      title: 'Publicación de Instagram',
    };
  }

  if (
    /\.(mp4|webm|ogg|ogv|mov)(\?.*)?$/i.test(originalUrl)
  ) {
    return {
      provider: 'video',
      src: originalUrl,
      originalUrl,
      title: 'Video',
    };
  }

  throw new Error(
    'URL no reconocida. Usa YouTube, TikTok, Instagram o un enlace directo a video.'
  );
};

const flattenCategories = (
  categories,
  parent = null
) => {
  if (!Array.isArray(categories)) {
    return [];
  }

  return categories.flatMap(category => {
    const normalizedCategory = {
      ...category,

      parent_slug:
        category.parent_slug ||
        category.parent?.slug ||
        parent?.slug ||
        null,

      parent_name:
        category.parent_name ||
        category.parent?.name ||
        parent?.name ||
        null,
    };

    const children =
      category.children ||
      category.subcategories ||
      category.categories ||
      [];

    return [
      normalizedCategory,

      ...flattenCategories(
        children,
        category
      ),
    ];
  });
};

const getOccasionalSections = categories => {
  const flattened =
    flattenCategories(categories);

  return flattened.filter(category => {
    const belongsToSections =
      category.parent_slug ===
        'secciones' ||
      category.parent?.slug ===
        'secciones';

    const isChild =
      category.nav_type
        ? category.nav_type === 'child'
        : Boolean(
            category.parent_id ||
            category.parent_slug
          );

    const isActive =
      category.is_active !== false;

    return (
      belongsToSections &&
      isChild &&
      isActive
    );
  });
};

const transformSelectedText = (editor, mode) => {
  const {
    from,
    to,
    empty,
  } = editor.state.selection;

  if (empty) {
    return false;
  }

  const selectedText = editor.state.doc.textBetween(
    from,
    to,
    '\n'
  );

  let transformed = selectedText;

  if (mode === 'upper') {
    transformed = selectedText.toLocaleUpperCase('es-MX');
  }

  if (mode === 'lower') {
    transformed = selectedText.toLocaleLowerCase('es-MX');
  }

  if (mode === 'title') {
    transformed = selectedText
      .toLocaleLowerCase('es-MX')
      .replace(
        /(^|[\s([{¿¡"'—-])([\p{L}\p{N}])/gu,
        (_, prefix, char) => {
          return `${prefix}${char.toLocaleUpperCase('es-MX')}`;
        }
      );
  }

  editor
    .chain()
    .focus()
    .insertContentAt(
      {
        from,
        to,
      },
      transformed
    )
    .setTextSelection({
      from,
      to: from + transformed.length,
    })
    .run();

  return true;
};

export default function ArticleEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const alert = useAlert();

  const isEdit = Boolean(id);

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [coverUrl, setCoverUrl] = useState('');

  const [
    collaboratorId,
    setCollaboratorId,
  ] = useState('');

  const [
    editionId,
    setEditionId,
  ] = useState('');

const [
  categoryIds,
  setCategoryIds,
] = useState([]);

const [
  sectionsDropdownOpen,
  setSectionsDropdownOpen,
] = useState(false);

const [tags, setTags] = useState([]);
const [tagInput, setTagInput] = useState('');

  const [
    isFeatured,
    setIsFeatured,
  ] = useState(false);

  const [
    featuredOrder,
    setFeaturedOrder,
  ] = useState(0);

  const [status, setStatus] = useState('draft');

  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);

  const [
    publishing,
    setPublishing,
  ] = useState(false);

  const [
    uploadingCover,
    setUploadingCover,
  ] = useState(false);

const [
  uploadingMedia,
  setUploadingMedia,
] = useState(false);

const [
  mediaUploadProgress,
  setMediaUploadProgress,
] = useState(0);

const [
  urlDialogOpen,
  setUrlDialogOpen,
] = useState(false);

const [
  urlInput,
  setUrlInput,
] = useState('');

const [
  detectingUrl,
  setDetectingUrl,
] = useState(false);

const [
  articleId,
  setArticleId,
] = useState(id || null);
  const loadedArticleIdRef = useRef(null);

  const [
    categories,
    setCategories,
  ] = useState([]);

  const [
    collaborators,
    setCollaborators,
  ] = useState([]);

const [
  editions,
  setEditions,
] = useState([]);

const selectedCollaborator =
  collaborators.find(collaborator => {
    return (
      String(collaborator.id) ===
      String(collaboratorId)
    );
  }) || null;

const occasionalSections =
  getOccasionalSections(categories);

const selectedOccasionalSections =
  occasionalSections.filter(category => {
    return categoryIds.includes(
      category.id
    );
  });

const editorExtensions = useCallback(() => {
  return [
    StarterKit.configure({
      link: false,
      underline: false,
    }),

    Underline,

    TextStyle,

    FontFamily,

    FontSize,

    Color,

    ListStyleAttributes,

    ResizableImage.configure({
      inline: false,
      allowBase64: true,
    }),

    MediaEmbed,

    Link.configure({
      openOnClick: false,
      autolink: true,
      defaultProtocol: 'https',

      HTMLAttributes: {
        class: 'editor-link',
        rel: 'noopener noreferrer',
        target: '_blank',
      },
    }),

    TextAlign.configure({
      types: [
        'heading',
        'paragraph',
      ],

      alignments: [
        'left',
        'center',
        'right',
        'justify',
      ],
    }),
  ];
}, []);

const editor = useEditor({
  extensions: editorExtensions(),

  content: '',

  editorProps: {
    attributes: {
      class: styles.editorArea,
      spellcheck: 'true',
    },

    handlePaste: (
      view,
      event
    ) => {
      const clipboardItems =
        Array.from(
          event.clipboardData?.items ||
          []
        );

      const imageItem =
        clipboardItems.find(item => {
          return item.type.startsWith(
            'image/'
          );
        });

      if (!imageItem) {
        return false;
      }

      const file =
        imageItem.getAsFile();

      if (!file) {
        return false;
      }

      event.preventDefault();

      const uploadClipboardImage =
        async () => {
          try {
            const extension =
              file.type.split('/')[1] ||
              'png';

            const clipboardFile =
              new File(
                [file],
                `imagen-portapapeles-${Date.now()}.${extension}`,
                {
                  type: file.type,
                }
              );

            const result =
              await uploadFile(
                clipboardFile,
                'articles/images'
              );

            const {
              from,
            } = view.state.selection;

            editor
              ?.chain()
              .focus()
              .insertContentAt(
                from,
                {
                  type: 'image',

                  attrs: {
                    src: result.url,

                    alt:
                      'Imagen pegada desde el portapapeles',

                    width: '100%',

                    height: 'auto',

                    rotation: 0,

                    float: 'center',

                    locked: false,

                    marginTop: '12px',

                    marginBottom: '12px',

                    caption: '',

                    href: '',
                  },
                }
              )
              .run();

            alert.success(
              'Imagen pegada',
              'La imagen del portapapeles se insertó correctamente'
            );
          } catch (error) {
            alert.error(
              'Error',
              error.response?.data?.error ||
                error.message ||
                'No se pudo pegar la imagen'
            );
          }
        };

      uploadClipboardImage();

      return true;
    },
  },
});

  useEffect(() => {
    Promise.all([
      getCategories(),
      getCollaborators(),
      getEditions(),
    ])
      .then(([cats, collabs, eds]) => {
        setCategories(cats);
        setCollaborators(collabs);
        setEditions(eds);
      })
      .catch(console.error);

    if (!isEdit || !id || !editor) {
      return;
    }

    if (loadedArticleIdRef.current === id) {
      return;
    }

    getArticleById(id)
      .then(article => {
        loadedArticleIdRef.current = id;

        setArticleId(article.id || id);
        setTitle(article.title || '');
        setSubtitle(article.subtitle || '');
        setExcerpt(article.excerpt || '');
        setCoverUrl(article.cover_image_url || '');

        setCollaboratorId(
          article.collaborator_id || ''
        );

        setEditionId(
          article.edition_id || ''
        );

        setCategoryIds(
          article.article_categories
            ?.map(item => item.categories?.id)
            .filter(Boolean) || []
        );

        setTags(
          article.article_tags || []
        );

        setIsFeatured(
          article.is_featured || false
        );

        setFeaturedOrder(
          article.featured_order ?? 0
        );

        setStatus(
          article.status || 'draft'
        );

        if (article.content) {
          editor.commands.setContent(
            article.content
          );
        } else if (article.content_html) {
          editor.commands.setContent(
            article.content_html
          );
        } else {
          editor.commands.clearContent();
        }
      })
      .catch(() => {
        alert.error(
          'Error',
          'No se pudo cargar el artículo'
        );
      });
  }, [
    id,
    editor,
    isEdit,
  ]);

  const buildPayload = () => {
    return {
      title: title.trim(),

      subtitle: subtitle.trim(),

      excerpt: excerpt.trim(),

      content: editor?.getJSON() || {},

      content_html: editor?.getHTML() || '',

      cover_image_url: coverUrl.trim(),

      collaborator_id:
        collaboratorId || null,

      edition_id:
        editionId || null,

      category_ids:
        categoryIds,

      tags: tags.map(tag => {
        return {
          tag: tag.tag || tag,
          tag_type:
            tag.tag_type || null,
        };
      }),

      is_featured:
        isFeatured,

      featured_order:
        isFeatured
          ? Number(featuredOrder)
          : null,
    };
  };

  const handleSave = async ({
    silent = false,
  } = {}) => {
if (!title.trim()) {
  alert.warning(
    'Falta el título',
    'El artículo necesita un título'
  );

  return null;
}

if (
  selectedCollaborator?.type ===
    'fixed' &&
  !selectedCollaborator
    .fixed_category_id
) {
  alert.warning(
    'Columna no asignada',
    'El autor fijo seleccionado no tiene una columna vinculada'
  );

  return null;
}

setSaving(true);

    try {
      const payload = buildPayload();

      if (articleId) {
        const result = await updateArticle(
          articleId,
          payload
        );

        if (!silent) {
          alert.success(
            'Guardado',
            'Borrador actualizado correctamente'
          );
        }

        return result || {
          id: articleId,
        };
      }

      const result = await createArticle(
        payload
      );

      const newArticleId = result?.id;

      if (!newArticleId) {
        throw new Error(
          'La API no devolvió el ID del artículo creado'
        );
      }

      setArticleId(newArticleId);
      setStatus('draft');

      if (!silent) {
        alert.success(
          'Guardado',
          'Artículo creado como borrador'
        );
      }

      navigate(
        `/admin/articulos/editar/${newArticleId}`,
        {
          replace: true,
        }
      );

      return result;
    } catch (error) {
      alert.error(
        'Error',
        error.response?.data?.error ||
          error.message ||
          'No se pudo guardar el artículo'
      );

      return null;
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
if (!title.trim()) {
  alert.warning(
    'Falta el título',
    'El artículo necesita un título'
  );

  return;
}

if (
  selectedCollaborator?.type ===
    'fixed' &&
  !selectedCollaborator
    .fixed_category_id
) {
  alert.warning(
    'Columna no asignada',
    'El autor fijo seleccionado no tiene una columna vinculada'
  );

  return;
}

if (
  selectedCollaborator?.type ===
    'occasional' &&
  categoryIds.length === 0
) {
  alert.warning(
    'Falta una sección',
    'Selecciona al menos una sección para el autor ocasional'
  );

  return;
}

setPublishing(true);

    try {
      let targetId = articleId;

      if (!targetId) {
        const created = await handleSave({
          silent: true,
        });

        targetId = created?.id;
      } else {
        const updated = await handleSave({
          silent: true,
        });

        if (!updated) {
          return;
        }
      }

      if (!targetId) {
        throw new Error(
          'No fue posible obtener el ID del artículo'
        );
      }

      await publishArticle(targetId);

      setStatus('published');

      alert.success(
        'Publicado',
        'El artículo ya está visible en la revista'
      );
    } catch (error) {
      alert.error(
        'Error',
        error.response?.data?.error ||
          error.message ||
          'No se pudo publicar'
      );
    } finally {
      setPublishing(false);
    }
  };

  const handleCoverUpload = async event => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setUploadingCover(true);

    try {
      const result = await uploadFile(
        file,
        'covers'
      );

      setCoverUrl(result.url);

      alert.success(
        'Imagen subida',
        'Portada cargada correctamente'
      );
    } catch (error) {
      alert.error(
        'Error',
        error.response?.data?.error ||
          'No se pudo subir la imagen'
      );
    } finally {
      setUploadingCover(false);
      event.target.value = '';
    }
  };

  const handleEditorImage = () => {
    const input =
      document.createElement('input');

    input.type = 'file';

    input.accept = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/avif',
    ].join(',');

    input.onchange = async event => {
      const file =
        event.target.files?.[0];

      if (!file) {
        return;
      }

      try {
        const result = await uploadFile(
          file,
          'articles/images'
        );

        editor
          ?.chain()
          .focus()
          .setImage({
            src: result.url,

            alt:
              file.name ||
              'Imagen del artículo',

width: '100%',

height: 'auto',

rotation: 0,

float: 'center',

            locked: false,

            marginTop: '12px',

            marginBottom: '12px',

            caption: '',

            href: '',
          })
          .run();
      } catch (error) {
        alert.error(
          'Error',
          error.response?.data?.error ||
            'No se pudo subir la imagen'
        );
      }
    };

    input.click();
  };

const insertImageUrl = url => {
  editor
    ?.chain()
    .focus()
    .setImage({
      src: url,

      alt: 'Imagen del artículo',

width: '100%',

height: 'auto',

rotation: 0,

float: 'center',

      locked: false,

      marginTop: '12px',

      marginBottom: '12px',

      caption: '',

      href: '',
    })
    .run();
};

const insertMediaNode = media => {
  editor
    ?.chain()
    .focus()
    .insertContent({
      type: 'mediaEmbed',

      attrs: {
        ...media,

        width: '100%',

        align: 'center',
      },
    })
    .run();
};

const closeUrlDialog = () => {
  if (detectingUrl) {
    return;
  }

  setUrlDialogOpen(false);
  setUrlInput('');
};

const openUrlDialog = () => {
  setUrlInput('');
  setUrlDialogOpen(true);
};

const isDirectImageUrl = url => {
  return /\.(jpg|jpeg|png|webp|gif|avif|svg|bmp)(\?.*)?$/i.test(
    url
  );
};

const checkImageUrl = url => {
  return new Promise(resolve => {
    const image = new Image();

    const timeout = window.setTimeout(() => {
      image.onload = null;
      image.onerror = null;
      resolve(false);
    }, 8000);

    image.onload = () => {
      window.clearTimeout(timeout);
      resolve(true);
    };

    image.onerror = () => {
      window.clearTimeout(timeout);
      resolve(false);
    };

    image.src = url;
  });
};

const handleUnifiedUrl = async event => {
  event.preventDefault();

  const url = normalizeUrl(urlInput);

  if (!url) {
    alert.warning(
      'URL requerida',
      'Escribe una URL de imagen o video'
    );

    return;
  }

  setDetectingUrl(true);

  try {
    try {
      const media = parseMediaUrl(url);

      insertMediaNode(media);

      setUrlDialogOpen(false);
      setUrlInput('');

      alert.success(
        'Video insertado',
        'El contenido multimedia se agregó al artículo'
      );

      return;
    } catch {
      // Si no es video, continuamos intentando detectarlo como imagen.
    }

    if (isDirectImageUrl(url)) {
      insertImageUrl(url);

      setUrlDialogOpen(false);
      setUrlInput('');

      alert.success(
        'Imagen insertada',
        'La imagen se agregó al artículo'
      );

      return;
    }

    const isImage = await checkImageUrl(url);

    if (isImage) {
      insertImageUrl(url);

      setUrlDialogOpen(false);
      setUrlInput('');

      alert.success(
        'Imagen insertada',
        'La imagen se agregó al artículo'
      );

      return;
    }

    alert.warning(
      'URL no reconocida',
      'Usa una imagen directa, YouTube, TikTok, Instagram o un enlace directo a video'
    );
  } catch (error) {
    alert.error(
      'Error al insertar',
      error.message ||
        'No fue posible procesar la URL'
    );
  } finally {
    setDetectingUrl(false);
  }
};

  const handleMediaUpload = () => {
    const input =
      document.createElement('input');

    input.type = 'file';

    input.accept = [
      'video/mp4',
      'video/webm',
      'video/ogg',
      'video/quicktime',
    ].join(',');

    input.onchange = async event => {
      const file =
        event.target.files?.[0];

      if (!file) {
        return;
      }

      setUploadingMedia(true);
      setMediaUploadProgress(0);

      try {
        const result = await uploadFile(
          file,
          'articles/videos',
          setMediaUploadProgress
        );

        insertMediaNode({
          provider: 'video',

          src: result.url,

          originalUrl: result.url,

          title:
            file.name ||
            'Video del artículo',
        });

        alert.success(
          'Video subido',
          'El video fue insertado en el artículo'
        );
      } catch (error) {
        alert.error(
          'Error',
          error.response?.data?.error ||
            'No se pudo subir el video'
        );
      } finally {
        setUploadingMedia(false);
        setMediaUploadProgress(0);
      }
    };

    input.click();
  };

  const handleLink = () => {
    if (editor.isActive('link')) {
      const currentHref =
        editor.getAttributes('link').href || '';

      const value = window.prompt(
        'Edita la URL. Déjala vacía para eliminar el enlace:',
        currentHref
      );

      if (value === null) {
        return;
      }

      if (!value.trim()) {
        editor
          .chain()
          .focus()
          .unsetLink()
          .run();

        return;
      }

      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({
          href: normalizeUrl(value),
        })
        .run();

      return;
    }

    const value = window.prompt(
      'URL del enlace:',
      'https://'
    );

    if (!value) {
      return;
    }

    editor
      .chain()
      .focus()
      .setLink({
        href: normalizeUrl(value),
      })
      .run();
  };

  const setOrderedListStyle = listStyleType => {
    if (!editor.isActive('orderedList')) {
      editor
        .chain()
        .focus()
        .toggleOrderedList()
        .run();
    }

    editor
      .chain()
      .focus()
      .updateAttributes(
        'orderedList',
        {
          listStyleType,
        }
      )
      .run();
  };

  const setBulletListStyle = listStyleType => {
    if (!editor.isActive('bulletList')) {
      editor
        .chain()
        .focus()
        .toggleBulletList()
        .run();
    }

    editor
      .chain()
      .focus()
      .updateAttributes(
        'bulletList',
        {
          listStyleType,
        }
      )
      .run();
  };

  const addTag = event => {
    if (
      event.key !== 'Enter' ||
      !tagInput.trim()
    ) {
      return;
    }

    event.preventDefault();

    const exists = tags.find(tag => {
      return (
        (tag.tag || tag) ===
        tagInput.trim()
      );
    });

    if (!exists) {
      setTags(previous => [
        ...previous,

        {
          tag: tagInput.trim(),
          tag_type: null,
        },
      ]);
    }

    setTagInput('');
  };

  const removeTag = targetTag => {
    setTags(previous => {
      return previous.filter(tag => {
        return (
          (tag.tag || tag) !==
          (targetTag.tag || targetTag)
        );
      });
    });
  };

const handleCollaboratorChange = event => {
  const nextCollaboratorId =
    event.target.value;

  setCollaboratorId(
    nextCollaboratorId
  );

  setSectionsDropdownOpen(false);

  if (!nextCollaboratorId) {
    setCategoryIds([]);
    return;
  }

  const collaborator =
    collaborators.find(item => {
      return (
        String(item.id) ===
        String(nextCollaboratorId)
      );
    });

  if (!collaborator) {
    setCategoryIds([]);
    return;
  }

  if (collaborator.type === 'fixed') {
    if (
      collaborator.fixed_category_id
    ) {
      setCategoryIds([
        collaborator.fixed_category_id,
      ]);
    } else {
      setCategoryIds([]);

      alert.warning(
        'Columna no asignada',
        'Este autor fijo no tiene una columna vinculada'
      );
    }

    return;
  }

  setCategoryIds([]);
};

const toggleOccasionalSection =
  categoryId => {
    setCategoryIds(previous => {
      if (
        previous.includes(categoryId)
      ) {
        return previous.filter(
          idValue =>
            idValue !== categoryId
        );
      }

      return [
        ...previous,
        categoryId,
      ];
    });
  };

const removeOccasionalSection =
  categoryId => {
    setCategoryIds(previous => {
      return previous.filter(
        idValue =>
          idValue !== categoryId
      );
    });
  };

if (!editor) {
    return null;
  }

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <div className={styles.topLeft}>
          <button
            type="button"
            onClick={() => {
              navigate('/admin/articulos');
            }}
            className={styles.backBtn}
          >
            ← Artículos
          </button>

          <div
            className={styles.statusBadge}
            data-status={status}
          >
            {status === 'draft'
              ? 'Borrador'
              : status === 'published'
                ? 'Publicado'
                : 'Archivado'}
          </div>
        </div>

        <div className={styles.topActions}>
          <button
            type="button"
            onClick={() => {
              setPreview(previous => {
                return !previous;
              });
            }}
            className={`${styles.actionBtn} ${
              preview
                ? styles.actionBtnActive
                : ''
            }`}
          >
            <Eye size={15} />

            {preview
              ? 'Editar'
              : 'Preview'}
          </button>

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={
              saving ||
              publishing
            }
            className={styles.saveBtn}
          >
            <Save size={15} />

            {saving
              ? 'Guardando...'
              : 'Guardar borrador'}
          </button>

          {status !== 'published' && (
            <button
              type="button"
              onClick={handlePublish}
              disabled={
                publishing ||
                saving
              }
              className={styles.publishBtn}
            >
              <Send size={15} />

              {publishing
                ? 'Publicando...'
                : 'Publicar'}
            </button>
          )}
        </div>
      </div>

      <div className={styles.layout}>
        <div className={styles.editorCol}>
          <input
            type="text"
            value={title}
            onChange={event => {
              setTitle(
                event.target.value
              );
            }}
            placeholder="Título del artículo..."
            className={styles.titleInput}
          />

          <input
            type="text"
            value={subtitle}
            onChange={event => {
              setSubtitle(
                event.target.value
              );
            }}
            placeholder="Subtítulo (opcional)..."
            className={styles.subtitleInput}
          />

          {!preview && (
            <div className={styles.toolbar}>
              <div className={styles.toolbarRow}>
                <ToolBtn
                  onClick={() => {
                    editor
                      .chain()
                      .focus()
                      .undo()
                      .run();
                  }}
                  disabled={
                    !editor.can().undo()
                  }
                  title="Deshacer"
                >
                  <Undo size={15} />
                </ToolBtn>

                <ToolBtn
                  onClick={() => {
                    editor
                      .chain()
                      .focus()
                      .redo()
                      .run();
                  }}
                  disabled={
                    !editor.can().redo()
                  }
                  title="Rehacer"
                >
                  <Redo size={15} />
                </ToolBtn>

                <div className={styles.toolSep} />

                <select
                  className={`${styles.toolSelect} ${styles.styleSelect}`}
                  value={
                    editor.isActive(
                      'heading',
                      {
                        level: 1,
                      }
                    )
                      ? '1'
                      : editor.isActive(
                            'heading',
                            {
                              level: 2,
                            }
                          )
                        ? '2'
                        : editor.isActive(
                              'heading',
                              {
                                level: 3,
                              }
                            )
                          ? '3'
                          : 'p'
                  }
                  onChange={event => {
                    const value =
                      event.target.value;

                    if (value === 'p') {
                      editor
                        .chain()
                        .focus()
                        .setParagraph()
                        .run();

                      return;
                    }

                    editor
                      .chain()
                      .focus()
                      .setHeading({
                        level:
                          Number(value),
                      })
                      .run();
                  }}
                  title="Estilo de párrafo"
                >
                  <option value="p">
                    Texto normal
                  </option>

                  <option value="1">
                    Título 1
                  </option>

                  <option value="2">
                    Título 2
                  </option>

                  <option value="3">
                    Título 3
                  </option>
                </select>

                <select
                  className={`${styles.toolSelect} ${styles.fontSelect}`}
                  value={
                    editor.getAttributes(
                      'textStyle'
                    ).fontFamily || ''
                  }
                  onChange={event => {
                    const value =
                      event.target.value;

                    if (!value) {
                      editor
                        .chain()
                        .focus()
                        .unsetFontFamily()
                        .run();

                      return;
                    }

                    editor
                      .chain()
                      .focus()
                      .setFontFamily(value)
                      .run();
                  }}
                  title="Tipografía"
                >
                  <option value="">
                    Tipografía
                  </option>

                  {FONT_FAMILIES.map(font => (
                    <option
                      key={font.label}
                      value={font.value}
                      style={{
                        fontFamily:
                          font.value,
                      }}
                    >
                      {font.label}
                    </option>
                  ))}
                </select>

                <select
                  className={`${styles.toolSelect} ${styles.sizeSelect}`}
                  value={String(
                    editor.getAttributes(
                      'textStyle'
                    ).fontSize || ''
                  ).replace('px', '')}
                  onChange={event => {
                    const value =
                      event.target.value;

                    if (!value) {
                      editor
                        .chain()
                        .focus()
                        .unsetFontSize()
                        .run();

                      return;
                    }

                    editor
                      .chain()
                      .focus()
                      .setFontSize(
                        `${value}px`
                      )
                      .run();
                  }}
                  title="Tamaño de texto"
                >
                  <option value="">
                    Tamaño
                  </option>

                  {FONT_SIZES.map(size => (
                    <option
                      key={size}
                      value={size}
                    >
                      {size}
                    </option>
                  ))}
                </select>

                <div className={styles.toolSep} />

                <ToolBtn
                  onClick={() => {
                    editor
                      .chain()
                      .focus()
                      .toggleBold()
                      .run();
                  }}
                  active={
                    editor.isActive('bold')
                  }
                  title="Negrita"
                >
                  <Bold size={15} />
                </ToolBtn>

                <ToolBtn
                  onClick={() => {
                    editor
                      .chain()
                      .focus()
                      .toggleItalic()
                      .run();
                  }}
                  active={
                    editor.isActive(
                      'italic'
                    )
                  }
                  title="Cursiva"
                >
                  <Italic size={15} />
                </ToolBtn>

                <ToolBtn
                  onClick={() => {
                    editor
                      .chain()
                      .focus()
                      .toggleUnderline()
                      .run();
                  }}
                  active={
                    editor.isActive(
                      'underline'
                    )
                  }
                  title="Subrayado"
                >
                  <UnderlineIcon size={15} />
                </ToolBtn>

                <ToolBtn
                  onClick={() => {
                    editor
                      .chain()
                      .focus()
                      .toggleStrike()
                      .run();
                  }}
                  active={
                    editor.isActive(
                      'strike'
                    )
                  }
                  title="Tachado"
                >
                  <Strikethrough size={15} />
                </ToolBtn>

<label
  className={styles.colorControl}
  title="Cambiar color del texto"
>
  <span
    className={styles.colorLetter}
    style={{
      color:
        editor.getAttributes(
          'textStyle'
        ).color || '#111111',
    }}
  >
    A
  </span>

  <input
    type="color"
    className={styles.colorPicker}
    value={
      editor.getAttributes(
        'textStyle'
      ).color || '#111111'
    }
    onInput={event => {
      editor
        .chain()
        .focus()
        .setColor(
          event.target.value
        )
        .run();
    }}
    aria-label="Cambiar color del texto"
  />
</label>

                <ToolBtn
                  onClick={() => {
                    editor
                      .chain()
                      .focus()
                      .unsetColor()
                      .run();
                  }}
                  title="Quitar color"
                >
                  <RotateCcw size={14} />
                </ToolBtn>
              </div>

              <div className={styles.toolbarRow}>
                <ToolBtn
                  onClick={() => {
                    transformSelectedText(
                      editor,
                      'upper'
                    );
                  }}
                  title="Convertir selección a MAYÚSCULAS"
                >
                  <CaseUpper size={16} />
                </ToolBtn>

                <ToolBtn
                  onClick={() => {
                    transformSelectedText(
                      editor,
                      'lower'
                    );
                  }}
                  title="Convertir selección a minúsculas"
                >
                  <CaseLower size={16} />
                </ToolBtn>

                <ToolBtn
                  onClick={() => {
                    transformSelectedText(
                      editor,
                      'title'
                    );
                  }}
                  title="Primera letra de cada palabra en mayúscula"
                >
                  <CaseSensitive size={16} />
                </ToolBtn>

                <div className={styles.toolSep} />

                <ToolBtn
                  onClick={() => {
                    editor
                      .chain()
                      .focus()
                      .setTextAlign(
                        'left'
                      )
                      .run();
                  }}
                  active={editor.isActive({
                    textAlign: 'left',
                  })}
                  title="Alinear a la izquierda"
                >
                  <AlignLeft size={15} />
                </ToolBtn>

                <ToolBtn
                  onClick={() => {
                    editor
                      .chain()
                      .focus()
                      .setTextAlign(
                        'center'
                      )
                      .run();
                  }}
                  active={editor.isActive({
                    textAlign: 'center',
                  })}
                  title="Centrar"
                >
                  <AlignCenter size={15} />
                </ToolBtn>

                <ToolBtn
                  onClick={() => {
                    editor
                      .chain()
                      .focus()
                      .setTextAlign(
                        'right'
                      )
                      .run();
                  }}
                  active={editor.isActive({
                    textAlign: 'right',
                  })}
                  title="Alinear a la derecha"
                >
                  <AlignRight size={15} />
                </ToolBtn>

                <ToolBtn
                  onClick={() => {
                    editor
                      .chain()
                      .focus()
                      .setTextAlign(
                        'justify'
                      )
                      .run();
                  }}
                  active={editor.isActive({
                    textAlign: 'justify',
                  })}
                  title="Justificar"
                >
                  <AlignJustify size={15} />
                </ToolBtn>

                <div className={styles.toolSep} />

                <select
                  className={`${styles.toolSelect} ${styles.listSelect}`}
                  defaultValue=""
                  onChange={event => {
                    const value =
                      event.target.value;

                    if (!value) {
                      return;
                    }

                    if (
                      value.startsWith(
                        'bullet:'
                      )
                    ) {
                      setBulletListStyle(
                        value.split(':')[1]
                      );
                    } else {
                      setOrderedListStyle(
                        value.split(':')[1]
                      );
                    }

                    event.target.value = '';
                  }}
                  title="Tipos de lista"
                >
                  <option value="">
                    Listas
                  </option>

                  <option value="bullet:disc">
                    • Viñetas
                  </option>

                  <option value="bullet:circle">
                    ○ Círculos
                  </option>

                  <option value="bullet:square">
                    ■ Cuadrados
                  </option>

                  <option value="ordered:decimal">
                    1. Números
                  </option>

                  <option value="ordered:lower-alpha">
                    a. Letras
                  </option>

                  <option value="ordered:upper-alpha">
                    A. Letras mayúsculas
                  </option>

                  <option value="ordered:lower-roman">
                    i. Romanos
                  </option>

                  <option value="ordered:upper-roman">
                    I. Romanos mayúsculos
                  </option>
                </select>

                <ToolBtn
                  onClick={() => {
                    editor
                      .chain()
                      .focus()
                      .toggleBulletList()
                      .run();
                  }}
                  active={
                    editor.isActive(
                      'bulletList'
                    )
                  }
                  title="Activar/desactivar viñetas"
                >
                  <List size={15} />
                </ToolBtn>

                <ToolBtn
                  onClick={() => {
                    editor
                      .chain()
                      .focus()
                      .toggleOrderedList()
                      .run();
                  }}
                  active={
                    editor.isActive(
                      'orderedList'
                    )
                  }
                  title="Activar/desactivar lista numerada"
                >
                  <ListOrdered size={15} />
                </ToolBtn>

                <ToolBtn
                  onClick={() => {
                    editor
                      .chain()
                      .focus()
                      .toggleBlockquote()
                      .run();
                  }}
                  active={
                    editor.isActive(
                      'blockquote'
                    )
                  }
                  title="Cita"
                >
                  <Quote size={15} />
                </ToolBtn>

                <ToolBtn
                  onClick={() => {
                    editor
                      .chain()
                      .focus()
                      .setHorizontalRule()
                      .run();
                  }}
                  title="Insertar línea horizontal"
                >
                  <Minus size={15} />
                </ToolBtn>

                <div className={styles.toolSep} />

                <ToolBtn
                  onClick={handleLink}
                  active={
                    editor.isActive('link')
                  }
                  title="Insertar o editar enlace"
                >
                  <LinkIcon size={15} />
                </ToolBtn>

                <ToolBtn
                  onClick={() => {
                    editor
                      .chain()
                      .focus()
                      .unsetLink()
                      .run();
                  }}
                  disabled={
                    !editor.isActive('link')
                  }
                  title="Eliminar enlace"
                >
                  <Unlink size={15} />
                </ToolBtn>

                <div className={styles.toolSep} />

<ToolBtn
  onClick={handleEditorImage}
  title="Subir imagen"
>
  <ImageIcon size={15} />
</ToolBtn>

<ToolBtn
  onClick={handleMediaUpload}
  disabled={uploadingMedia}
  title="Subir video"
>
  <Video size={15} />
</ToolBtn>

<button
  type="button"
  className={styles.urlToolBtn}
  onClick={openUrlDialog}
  title="Insertar imagen o video mediante URL"
>
  <LinkIcon size={15} />

  <span>URL</span>
</button>

{uploadingMedia && (
  <span
    className={styles.uploadProgress}
  >
    Subiendo {mediaUploadProgress}%
  </span>
)}
              </div>
            </div>
          )}

          {preview ? (
            <div className={styles.previewWrap}>
              <div className={styles.previewLabel}>
                Preview publicado
              </div>

              {coverUrl && (
                <img
                  src={coverUrl}
                  alt="Portada"
                  className={styles.previewCover}
                />
              )}

              <h1 className={styles.previewTitle}>
                {title || 'Sin título'}
              </h1>

              {subtitle && (
                <p className={styles.previewSubtitle}>
                  {subtitle}
                </p>
              )}

              <div
                className={styles.previewBody}
                dangerouslySetInnerHTML={{
                  __html:
                    editor.getHTML(),
                }}
              />
            </div>
          ) : (
            <EditorContent
              editor={editor}
              className={styles.editorWrap}
            />
          )}
        </div>

        <aside className={styles.sidebar}>
          <SidePanel title="Imagen de portada">
            {coverUrl && (
              <div className={styles.coverPreview}>
                <img
                  src={coverUrl}
                  alt="Portada"
                />

                <button
                  type="button"
                  className={styles.removeCover}
                  onClick={() => {
                    setCoverUrl('');
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            )}

            <label className={styles.uploadBtn}>
              <Upload size={14} />

              {uploadingCover
                ? 'Subiendo...'
                : coverUrl
                  ? 'Cambiar portada'
                  : 'Subir portada'}

              <input
                type="file"
                accept="image/*"
                onChange={handleCoverUpload}
                hidden
              />
            </label>

            <input
              type="text"
              value={coverUrl}
              onChange={event => {
                setCoverUrl(
                  event.target.value
                );
              }}
              placeholder="O pega URL de imagen..."
              className={styles.sideInput}
            />
          </SidePanel>

          <SidePanel title="Extracto">
            <textarea
              value={excerpt}
              onChange={event => {
                setExcerpt(
                  event.target.value
                );
              }}
              placeholder="Resumen breve para las cards..."
              className={styles.sideTextarea}
              rows={3}
              maxLength={300}
            />

            <div className={styles.charCount}>
              {excerpt.length}/300
            </div>
          </SidePanel>

<SidePanel title="Autor">
  <select
    value={collaboratorId}
    onChange={
      handleCollaboratorChange
    }
    className={styles.sideSelect}
  >
    <option value="">
      Sin autor asignado
    </option>

    {collaborators.map(
      collaborator => (
        <option
          key={collaborator.id}
          value={collaborator.id}
        >
          {collaborator.name}
        </option>
      )
    )}
  </select>

  {selectedCollaborator?.type ===
    'fixed' && (
    <div
      className={
        styles.authorCategoryBlock
      }
    >
      <div
        className={
          styles.authorCategoryLabel
        }
      >
        Columna fija
      </div>

      {selectedCollaborator
        .fixed_category ? (
        <div
          className={
            styles.fixedCategoryCard
          }
        >
          <div
            className={
              styles.fixedCategoryMark
            }
          >
            Κ
          </div>

          <div
            className={
              styles.fixedCategoryContent
            }
          >
            <strong>
              {
                selectedCollaborator
                  .fixed_category.name
              }
            </strong>

            <span>
              Asignada automáticamente
            </span>
          </div>
        </div>
      ) : (
        <div
          className={
            styles.missingCategoryMessage
          }
        >
          Este autor no tiene una
          columna fija asignada.
        </div>
      )}
    </div>
  )}

  {selectedCollaborator?.type ===
    'occasional' && (
    <div
      className={
        styles.authorCategoryBlock
      }
    >
      <div
        className={
          styles.authorCategoryLabel
        }
      >
        Secciones ocasionales
      </div>

      <div
        className={
          styles.multiSelect
        }
      >
        <button
          type="button"
          className={
            styles.multiSelectTrigger
          }
          onClick={() => {
            setSectionsDropdownOpen(
              previous => !previous
            );
          }}
          aria-expanded={
            sectionsDropdownOpen
          }
        >
          <span>
            {selectedOccasionalSections
              .length > 0
              ? `${selectedOccasionalSections.length} seleccionada${
                  selectedOccasionalSections
                    .length === 1
                    ? ''
                    : 's'
                }`
              : 'Seleccionar secciones'}
          </span>

          <span
            className={`${styles.multiSelectArrow} ${
              sectionsDropdownOpen
                ? styles.multiSelectArrowOpen
                : ''
            }`}
          >
            ▾
          </span>
        </button>

        {sectionsDropdownOpen && (
          <div
            className={
              styles.multiSelectMenu
            }
          >
            {occasionalSections.length >
            0 ? (
              occasionalSections.map(
                category => (
                  <label
                    key={category.id}
                    className={
                      styles.multiSelectOption
                    }
                  >
                    <input
                      type="checkbox"
                      checked={categoryIds.includes(
                        category.id
                      )}
                      onChange={() => {
                        toggleOccasionalSection(
                          category.id
                        );
                      }}
                    />

                    <span>
                      {category.name}
                    </span>
                  </label>
                )
              )
            ) : (
              <div
                className={
                  styles.multiSelectEmpty
                }
              >
                No hay secciones
                ocasionales disponibles.
              </div>
            )}
          </div>
        )}
      </div>

      {selectedOccasionalSections
        .length > 0 && (
        <div
          className={
            styles.selectedSections
          }
        >
          {selectedOccasionalSections.map(
            category => (
              <span
                key={category.id}
                className={
                  styles.selectedSectionTag
                }
              >
                {category.name}

                <button
                  type="button"
                  onClick={() => {
                    removeOccasionalSection(
                      category.id
                    );
                  }}
                  aria-label={`Quitar ${category.name}`}
                >
                  <X size={11} />
                </button>
              </span>
            )
          )}
        </div>
      )}
    </div>
  )}
</SidePanel>

          <SidePanel title="Edición">
            <select
              value={editionId}
              onChange={event => {
                setEditionId(
                  event.target.value
                );
              }}
              className={styles.sideSelect}
            >
              <option value="">
                Sin edición
              </option>

              {editions.map(edition => (
                <option
                  key={edition.id}
                  value={edition.id}
                >
                  № {edition.number} — {edition.name}
                </option>
              ))}
            </select>
          </SidePanel>



          <SidePanel title="Etiquetas">
            <input
              type="text"
              value={tagInput}
              onChange={event => {
                setTagInput(
                  event.target.value
                );
              }}
              onKeyDown={addTag}
              placeholder="Escribe y presiona Enter..."
              className={styles.sideInput}
            />

            <div className={styles.tagsList}>
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className={styles.tag}
                >
                  {tag.tag || tag}

                  <button
                    type="button"
                    onClick={() => {
                      removeTag(tag);
                    }}
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          </SidePanel>

          <SidePanel title="Opciones">
            <label className={styles.checkLabel}>
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={event => {
                  setIsFeatured(
                    event.target.checked
                  );
                }}
              />

              <span>
                Destacado / Highlight
                (rodea la portada en el home)
              </span>
            </label>

            {isFeatured && (
              <div className={styles.featuredOrder}>
                <label
                  className={
                    styles.featuredOrderLabel
                  }
                >
                  Posición en el home
                  (1 a 4)
                </label>

                <select
                  value={featuredOrder}
                  onChange={event => {
                    setFeaturedOrder(
                      event.target.value
                    );
                  }}
                  className={styles.sideSelect}
                >
                  <option value={0}>
                    Sin posición fija
                  </option>

                  <option value={1}>
                    1 — Arriba izquierda
                  </option>

                  <option value={2}>
                    2 — Abajo izquierda
                  </option>

                  <option value={3}>
                    3 — Arriba derecha
                  </option>

                  <option value={4}>
                    4 — Abajo derecha
                  </option>
                </select>
              </div>
            )}
          </SidePanel>
        </aside>
      </div>

      {urlDialogOpen && (
        <div
          className={styles.urlDialogBackdrop}
          onMouseDown={event => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeUrlDialog();
            }
          }}
        >
          <form
            className={styles.urlDialog}
            onSubmit={handleUnifiedUrl}
          >
            <div
              className={styles.urlDialogTopBar}
            />

            <div
              className={styles.urlDialogBody}
            >
              <div
                className={styles.urlDialogIconWrap}
              >
                <span
                  className={styles.urlDialogIcon}
                >
                  Λ
                </span>
              </div>

              <div
                className={styles.urlDialogContent}
              >
                <div
                  className={styles.urlDialogType}
                >
                  Ἀγορά
                </div>

                <h2
                  className={styles.urlDialogTitle}
                >
                  Insertar contenido por URL
                </h2>

                <p
                  className={styles.urlDialogMessage}
                >
                  Pega una imagen, YouTube,
                  TikTok, Instagram o un video
                  directo. El editor detectará
                  automáticamente el tipo.
                </p>

                <input
                  type="url"
                  value={urlInput}
                  onChange={event => {
                    setUrlInput(
                      event.target.value
                    );
                  }}
                  placeholder="https://..."
                  className={styles.urlDialogInput}
                  autoFocus
                  disabled={detectingUrl}
                />
              </div>
            </div>

            <div
              className={styles.urlDialogMeander}
            >
              <span />
              <span />
              <span />
            </div>

            <div
              className={styles.urlDialogActions}
            >
              <button
                type="button"
                className={
                  styles.urlDialogCancelBtn
                }
                onClick={closeUrlDialog}
                disabled={detectingUrl}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className={
                  styles.urlDialogConfirmBtn
                }
                disabled={
                  detectingUrl ||
                  !urlInput.trim()
                }
              >
                {detectingUrl
                  ? 'Detectando...'
                  : 'Insertar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function ToolBtn({
  onClick,
  active = false,
  disabled = false,
  title,
  children,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`${styles.toolBtn} ${
        active
          ? styles.toolBtnActive
          : ''
      }`}
    >
      {children}
    </button>
  );
}

function SidePanel({
  title,
  children,
}) {
  return (
    <div className={styles.sidePanel}>
      <div className={styles.sidePanelTitle}>
        {title}
      </div>

      {children}
    </div>
  );
}