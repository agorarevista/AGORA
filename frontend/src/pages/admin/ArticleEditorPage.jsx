import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import { createArticle, updateArticle, getArticleById, publishArticle } from '../../api/articles.api';
import { getCategories } from '../../api/categories.api';
import { getCollaborators } from '../../api/collaborators.api';
import { getEditions } from '../../api/editions.api';
import { uploadFile } from '../../api/admin.api';
import useAlert from '../../hooks/useAlert';
import { formatDate } from '../../utils/formatDate';
import ResizableImage from './editor/ResizableImage.js';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Quote, Minus, Link as LinkIcon,
  Image as ImageIcon, Undo, Redo, Eye, Save, Send,
  ChevronDown, X, Upload
} from 'lucide-react';
import styles from './ArticleEditorPage.module.css';

export default function ArticleEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const alert = useAlert();
  const isEdit = !!id;

  // ── Estado del artículo ────────────────────────────────
  const [title, setTitle]           = useState('');
  const [subtitle, setSubtitle]     = useState('');
  const [excerpt, setExcerpt]       = useState('');
  const [coverUrl, setCoverUrl]     = useState('');
  const [collaboratorId, setCollaboratorId] = useState('');
  const [editionId, setEditionId]   = useState('');
  const [categoryIds, setCategoryIds] = useState([]);
  const [tags, setTags]             = useState([]);
  const [tagInput, setTagInput]     = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [status, setStatus]         = useState('draft');

  // ── Estado UI ──────────────────────────────────────────
  const [preview, setPreview]       = useState(false);
  const [saving, setSaving]         = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [articleId, setArticleId]   = useState(id || null);
  const loadedArticleIdRef = useRef(null);

  // ── Datos ──────────────────────────────────────────────
  const [categories, setCategories]     = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  const [editions, setEditions]         = useState([]);

  // ── Editor Tiptap ──────────────────────────────────────
  const editorExtensions = useCallback(() => ([
    StarterKit,
    Underline,
    TextStyle,
    Color,
    ResizableImage.configure({ inline: false, allowBase64: true }),
    Link.configure({ openOnClick: false, HTMLAttributes: { class: 'editor-link' } }),
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
  ]), []);
  const editor = useEditor({
    extensions: editorExtensions(),
    content: '',
    editorProps: {
      attributes: { class: styles.editorArea }
    }
  });

  // ── Cargar datos ───────────────────────────────────────
  useEffect(() => {
    Promise.all([
      getCategories(),
      getCollaborators(),
      getEditions(),
    ]).then(([cats, collabs, eds]) => {
      setCategories(cats);
      setCollaborators(collabs);
      setEditions(eds);
    }).catch(console.error);

    if (!isEdit || !id || !editor) return;
    if (loadedArticleIdRef.current === id) return;

    getArticleById(id).then(art => {
      loadedArticleIdRef.current = id;
      setArticleId(art.id || id);
      setTitle(art.title || '');
      setSubtitle(art.subtitle || '');
      setExcerpt(art.excerpt || '');
      setCoverUrl(art.cover_image_url || '');
      setCollaboratorId(art.collaborator_id || '');
      setEditionId(art.edition_id || '');
      setCategoryIds(art.article_categories?.map(ac => ac.categories?.id).filter(Boolean) || []);
      setTags(art.article_tags || []);
      setIsFeatured(art.is_featured || false);
      setStatus(art.status || 'draft');

      if (art.content_html) {
        editor.commands.setContent(art.content_html);
      } else {
        editor.commands.clearContent();
      }
    }).catch(() => {
      alert.error('Error', 'No se pudo cargar el artículo');
    });
  }, [id, editor, isEdit]);

  // ── Guardar borrador ───────────────────────────────────
  const handleSave = async () => {
    if (!title.trim()) {
      alert.warning('Falta el título', 'El artículo necesita un título');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title,
        subtitle,
        excerpt,
        content: editor?.getJSON() || {},
        content_html: editor?.getHTML() || '',
        cover_image_url: coverUrl,
        collaborator_id: collaboratorId || null,
        edition_id: editionId || null,
        category_ids: categoryIds,
        tags: tags.map(t => ({ tag: t.tag || t, tag_type: t.tag_type || null })),
        is_featured: isFeatured,
      };

      if (articleId) {
        await updateArticle(articleId, payload);
        alert.success('Guardado', 'Borrador actualizado correctamente');
      } else {
        const res = await createArticle(payload);
        const newArticleId = res?.id;

        if (!newArticleId) {
          throw new Error('La API no devolvió el id del artículo creado');
        }

        setArticleId(newArticleId);
        setStatus('draft');
        alert.success('Guardado', 'Artículo creado como borrador');
        navigate(`/admin/articulos/editar/${newArticleId}`, { replace: true });
      }
    } catch (err) {
      alert.error('Error', err.response?.data?.error || 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  // ── Publicar ───────────────────────────────────────────
  const handlePublish = async () => {
    if (!articleId) {
      await handleSave();
      return;
    }
    if (!title.trim()) {
      alert.warning('Falta el título', 'El artículo necesita un título');
      return;
    }
    setPublishing(true);
    try {
      await handleSave();
      await publishArticle(articleId);
      setStatus('published');
      alert.success('Publicado', 'El artículo ya está visible en la revista');
    } catch (err) {
      alert.error('Error', 'No se pudo publicar');
    } finally {
      setPublishing(false);
    }
  };

  // ── Upload imagen de portada ───────────────────────────
  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const res = await uploadFile(file, 'covers');
      setCoverUrl(res.url);
      alert.success('Imagen subida', 'Portada cargada correctamente');
    } catch {
      alert.error('Error', 'No se pudo subir la imagen');
    } finally {
      setUploadingCover(false);
    }
  };

  // ── Upload imagen en el editor ─────────────────────────
  const handleEditorImage = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const res = await uploadFile(file, 'articles');
        editor?.chain().focus().setImage({
          src: res.url,
          alt: file.name || 'Imagen del artículo',
          width: '100%',
          height: 'auto',
          float: 'center',
          locked: false,
          marginTop: '12px',
          marginBottom: '12px',
        }).run();
      } catch {
        alert.error('Error', 'No se pudo subir la imagen');
      }
    };
    input.click();
  };

  // ── Insertar link ──────────────────────────────────────
  const handleLink = () => {
    const url = window.prompt('URL del enlace:');
    if (url) {
      editor?.chain().focus().setLink({ href: url }).run();
    }
  };

  // ── Tags ───────────────────────────────────────────────
  const addTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.find(t => (t.tag || t) === tagInput.trim())) {
        setTags(prev => [...prev, { tag: tagInput.trim(), tag_type: null }]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tag) => {
    setTags(prev => prev.filter(t => (t.tag || t) !== (tag.tag || tag)));
  };

  // ── Toggle categoría ───────────────────────────────────
  const toggleCategory = (catId) => {
    setCategoryIds(prev =>
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    );
  };

  if (!editor) return null;

  return (
    <div className={styles.page}>

      {/* ── Top bar ───────────────────────────────────────── */}
      <div className={styles.topBar}>
        <div className={styles.topLeft}>
          <button onClick={() => navigate('/admin/articulos')} className={styles.backBtn}>
            ← Artículos
          </button>
          <div className={styles.statusBadge} data-status={status}>
            {status === 'draft' ? 'Borrador' : status === 'published' ? 'Publicado' : 'Archivado'}
          </div>
        </div>
        <div className={styles.topActions}>
          <button
            onClick={() => setPreview(p => !p)}
            className={`${styles.actionBtn} ${preview ? styles.actionBtnActive : ''}`}
          >
            <Eye size={15} />
            {preview ? 'Editar' : 'Preview'}
          </button>
          <button onClick={handleSave} disabled={saving} className={styles.saveBtn}>
            <Save size={15} />
            {saving ? 'Guardando...' : 'Guardar borrador'}
          </button>
          {status !== 'published' && (
            <button onClick={handlePublish} disabled={publishing} className={styles.publishBtn}>
              <Send size={15} />
              {publishing ? 'Publicando...' : 'Publicar'}
            </button>
          )}
        </div>
      </div>

      {/* ── Layout ───────────────────────────────────────── */}
      <div className={styles.layout}>

        {/* ── Editor principal ──────────────────────────── */}
        <div className={styles.editorCol}>

          {/* Título */}
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Título del artículo..."
            className={styles.titleInput}
          />

          {/* Subtítulo */}
          <input
            type="text"
            value={subtitle}
            onChange={e => setSubtitle(e.target.value)}
            placeholder="Subtítulo (opcional)..."
            className={styles.subtitleInput}
          />

          {/* Toolbar */}
          {!preview && (
            <div className={styles.toolbar}>
              {/* Deshacer/Rehacer */}
              <ToolBtn onClick={() => editor.chain().focus().undo().run()} title="Deshacer">
                <Undo size={14} />
              </ToolBtn>
              <ToolBtn onClick={() => editor.chain().focus().redo().run()} title="Rehacer">
                <Redo size={14} />
              </ToolBtn>

              <div className={styles.toolSep} />

              {/* Encabezados */}
              <select
                className={styles.toolSelect}
                onChange={e => {
                  const val = e.target.value;
                  if (val === 'p') editor.chain().focus().setParagraph().run();
                  else editor.chain().focus().toggleHeading({ level: parseInt(val) }).run();
                }}
              >
                <option value="p">Párrafo</option>
                <option value="1">Título 1</option>
                <option value="2">Título 2</option>
                <option value="3">Título 3</option>
              </select>

              <div className={styles.toolSep} />

              {/* Formato */}
              <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Negrita">
                <Bold size={14} />
              </ToolBtn>
              <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Cursiva">
                <Italic size={14} />
              </ToolBtn>
              <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Subrayado">
                <UnderlineIcon size={14} />
              </ToolBtn>
              <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Tachado">
                <Strikethrough size={14} />
              </ToolBtn>

              <div className={styles.toolSep} />

              {/* Alineación */}
              <ToolBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Izquierda">
                <AlignLeft size={14} />
              </ToolBtn>
              <ToolBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Centro">
                <AlignCenter size={14} />
              </ToolBtn>
              <ToolBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Derecha">
                <AlignRight size={14} />
              </ToolBtn>
              <ToolBtn onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="Justificar">
                <AlignJustify size={14} />
              </ToolBtn>

              <div className={styles.toolSep} />

              {/* Listas */}
              <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Lista">
                <List size={14} />
              </ToolBtn>
              <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Lista numerada">
                <ListOrdered size={14} />
              </ToolBtn>
              <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Cita">
                <Quote size={14} />
              </ToolBtn>
              <ToolBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Línea">
                <Minus size={14} />
              </ToolBtn>

              <div className={styles.toolSep} />

              {/* Link e imagen */}
              <ToolBtn onClick={handleLink} active={editor.isActive('link')} title="Enlace">
                <LinkIcon size={14} />
              </ToolBtn>
              <ToolBtn onClick={handleEditorImage} title="Imagen">
                <ImageIcon size={14} />
              </ToolBtn>

              {/* Color de texto */}
              <div className={styles.colorWrap} title="Color de texto">
                <input
                  type="color"
                  className={styles.colorPicker}
                  onInput={e => editor.chain().focus().setColor(e.target.value).run()}
                />
                <span style={{ fontSize: 11, color: 'var(--color-gray-500)' }}>A</span>
              </div>
            </div>
          )}


          {/* Editor / Preview */}
          {preview ? (
            <div className={styles.previewWrap}>
              <div className={styles.previewLabel}>Preview publicado</div>
              {coverUrl && <img src={coverUrl} alt="Portada" className={styles.previewCover} />}
              <h1 className={styles.previewTitle}>{title || 'Sin título'}</h1>
              {subtitle && <p className={styles.previewSubtitle}>{subtitle}</p>}
              <div
                className={styles.previewBody}
                dangerouslySetInnerHTML={{ __html: editor.getHTML() }}
              />
            </div>
          ) : (
            <EditorContent editor={editor} className={styles.editorWrap} />
          )}
        </div>

        {/* ── Panel lateral ──────────────────────────────── */}
        <aside className={styles.sidebar}>

          {/* Portada */}
          <SidePanel title="Imagen de portada">
            {coverUrl && (
              <div className={styles.coverPreview}>
                <img src={coverUrl} alt="Portada" />
                <button className={styles.removeCover} onClick={() => setCoverUrl('')}>
                  <X size={14} />
                </button>
              </div>
            )}
            <label className={styles.uploadBtn}>
              <Upload size={14} />
              {uploadingCover ? 'Subiendo...' : coverUrl ? 'Cambiar portada' : 'Subir portada'}
              <input type="file" accept="image/*" onChange={handleCoverUpload} hidden />
            </label>
            {coverUrl && (
              <input
                type="text"
                value={coverUrl}
                onChange={e => setCoverUrl(e.target.value)}
                placeholder="O pega URL..."
                className={styles.sideInput}
              />
            )}
            {!coverUrl && (
              <input
                type="text"
                value={coverUrl}
                onChange={e => setCoverUrl(e.target.value)}
                placeholder="O pega URL de imagen..."
                className={styles.sideInput}
              />
            )}
          </SidePanel>

          {/* Extracto */}
          <SidePanel title="Extracto">
            <textarea
              value={excerpt}
              onChange={e => setExcerpt(e.target.value)}
              placeholder="Resumen breve para las cards..."
              className={styles.sideTextarea}
              rows={3}
              maxLength={300}
            />
            <div className={styles.charCount}>{excerpt.length}/300</div>
          </SidePanel>

          {/* Colaborador */}
          <SidePanel title="Autor">
            <select
              value={collaboratorId}
              onChange={e => setCollaboratorId(e.target.value)}
              className={styles.sideSelect}
            >
              <option value="">Sin autor asignado</option>
              {collaborators.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </SidePanel>

          {/* Edición */}
          <SidePanel title="Edición">
            <select
              value={editionId}
              onChange={e => setEditionId(e.target.value)}
              className={styles.sideSelect}
            >
              <option value="">Sin edición</option>
              {editions.map(e => (
                <option key={e.id} value={e.id}>№ {e.number} — {e.name}</option>
              ))}
            </select>
          </SidePanel>

          {/* Categorías */}
          <SidePanel title="Secciones">
            <div className={styles.catList}>
              {categories.map(cat => (
                <label key={cat.id} className={styles.catItem}>
                  <input
                    type="checkbox"
                    checked={categoryIds.includes(cat.id)}
                    onChange={() => toggleCategory(cat.id)}
                  />
                  <span>{cat.name}</span>
                </label>
              ))}
            </div>
          </SidePanel>

          {/* Tags */}
          <SidePanel title="Etiquetas">
            <input
              type="text"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={addTag}
              placeholder="Escribe y presiona Enter..."
              className={styles.sideInput}
            />
            <div className={styles.tagsList}>
              {tags.map((t, i) => (
                <span key={i} className={styles.tag}>
                  {t.tag || t}
                  <button onClick={() => removeTag(t)}><X size={10} /></button>
                </span>
              ))}
            </div>
          </SidePanel>

          {/* Opciones */}
          <SidePanel title="Opciones">
            <label className={styles.checkLabel}>
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={e => setIsFeatured(e.target.checked)}
              />
              <span>Artículo destacado (aparece en homepage)</span>
            </label>
          </SidePanel>

        </aside>
      </div>
    </div>
  );
}

// ── Componentes auxiliares ────────────────────────────────
function ToolBtn({ onClick, active, title, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`${styles.toolBtn} ${active ? styles.toolBtnActive : ''}`}
      type="button"
    >
      {children}
    </button>
  );
}

function SidePanel({ title, children }) {
  return (
    <div className={styles.sidePanel}>
      <div className={styles.sidePanelTitle}>{title}</div>
      {children}
    </div>
  );
}