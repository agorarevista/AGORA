import { NodeViewWrapper } from '@tiptap/react';
import {
  Copy,
  Trash2,
  Lock,
  Unlock,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Move,
} from 'lucide-react';
import styles from '../ArticleEditorPage.module.css';

const clampPercent = (value, fallback = 100) => {
  const num = Number.parseFloat(String(value).replace('%', ''));
  if (!Number.isFinite(num)) return fallback;
  return Math.min(100, Math.max(15, num));
};

const clampPx = (value, fallback = 320) => {
  const num = Number.parseFloat(String(value).replace('px', ''));
  if (!Number.isFinite(num)) return fallback;
  return Math.min(1600, Math.max(80, num));
};

export default function ResizableImageView(props) {
  const { node, selected, updateAttributes, deleteNode, editor, getPos } = props;

  const {
    src,
    alt,
    width = '100%',
    height = 'auto',
    float = 'center',
    locked = false,
    marginTop = '12px',
    marginBottom = '12px',
  } = node.attrs;

  const widthNum = clampPercent(width, 100);
  const heightNum = height === 'auto' ? 'auto' : clampPx(height, 320);

  const duplicateImage = () => {
    if (typeof getPos !== 'function') return;
    const pos = getPos();
    editor
      .chain()
      .focus()
      .insertContentAt(pos + node.nodeSize, node.toJSON())
      .run();
  };

  const toggleLock = () => {
    updateAttributes({ locked: !locked });
  };

  const setFloat = nextFloat => {
    updateAttributes({ float: nextFloat });
  };

  const startResize = (event, direction) => {
    event.preventDefault();
    event.stopPropagation();

    if (locked) return;

    const startX = event.clientX;
    const startY = event.clientY;
    const startWidth = clampPercent(width, 100);
    const startHeight = height === 'auto' ? null : clampPx(height, 320);

    const onMove = moveEvent => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      let nextWidth = startWidth;
      let nextHeight = startHeight;

      if (direction.includes('right')) nextWidth = startWidth + dx / 4;
      if (direction.includes('left')) nextWidth = startWidth - dx / 4;

      if (direction.includes('bottom')) {
        nextHeight = (startHeight ?? 320) + dy;
      }

      if (direction.includes('top')) {
        nextHeight = (startHeight ?? 320) - dy;
      }

      const attrs = {
        width: `${Math.min(100, Math.max(15, nextWidth))}%`,
      };

      if (direction.includes('top') || direction.includes('bottom')) {
        attrs.height = `${Math.min(1600, Math.max(80, nextHeight))}px`;
      }

      updateAttributes(attrs);
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const wrapperStyle = {
    marginTop,
    marginBottom,
  };

  const imageBoxStyle = {
    width: `${widthNum}%`,
    height: heightNum === 'auto' ? 'auto' : `${heightNum}px`,
  };

  if (float === 'left') {
    wrapperStyle.float = 'left';
    wrapperStyle.marginRight = '18px';
    wrapperStyle.marginLeft = '0';
  } else if (float === 'right') {
    wrapperStyle.float = 'right';
    wrapperStyle.marginLeft = '18px';
    wrapperStyle.marginRight = '0';
  } else {
    wrapperStyle.display = 'flex';
    wrapperStyle.justifyContent = 'center';
    wrapperStyle.clear = 'both';
  }

  return (
    <NodeViewWrapper
      className={`${styles.resizableImageNode} ${selected ? styles.resizableImageNodeSelected : ''} ${locked ? styles.resizableImageNodeLocked : ''}`}
      style={wrapperStyle}
      data-float={float}
      data-locked={locked ? 'true' : 'false'}
    >
      <div
        className={styles.resizableImageInner}
        style={imageBoxStyle}
        contentEditable={false}
      >
        {selected && (
          <div className={styles.imageFloatingToolbar}>
            <button
              type="button"
              className={styles.imageToolbarBtn}
              title="Mover"
              draggable
              data-drag-handle
            >
              <Move size={14} />
            </button>

            <button
              type="button"
              className={styles.imageToolbarBtn}
              title="Duplicar"
              onClick={duplicateImage}
            >
              <Copy size={14} />
            </button>

            <button
              type="button"
              className={styles.imageToolbarBtn}
              title={locked ? 'Desbloquear' : 'Fijar'}
              onClick={toggleLock}
            >
              {locked ? <Unlock size={14} /> : <Lock size={14} />}
            </button>

            <button
              type="button"
              className={`${styles.imageToolbarBtn} ${float === 'left' ? styles.imageToolbarBtnActive : ''}`}
              title="Izquierda"
              onClick={() => setFloat('left')}
            >
              <AlignLeft size={14} />
            </button>

            <button
              type="button"
              className={`${styles.imageToolbarBtn} ${float === 'center' ? styles.imageToolbarBtnActive : ''}`}
              title="Centro"
              onClick={() => setFloat('center')}
            >
              <AlignCenter size={14} />
            </button>

            <button
              type="button"
              className={`${styles.imageToolbarBtn} ${float === 'right' ? styles.imageToolbarBtnActive : ''}`}
              title="Derecha"
              onClick={() => setFloat('right')}
            >
              <AlignRight size={14} />
            </button>

            <button
              type="button"
              className={`${styles.imageToolbarBtn} ${styles.imageToolbarBtnDanger}`}
              title="Eliminar"
              onClick={deleteNode}
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}

        <img
          src={src}
          alt={alt || 'Imagen del artículo'}
          className={styles.resizableImageElement}
          draggable={false}
        />

        {selected && !locked && (
          <>
            <button
              type="button"
              className={`${styles.imageResizeHandle} ${styles.imageResizeHandleRight}`}
              onMouseDown={e => startResize(e, 'right')}
              aria-label="Cambiar ancho"
            />
            <button
              type="button"
              className={`${styles.imageResizeHandle} ${styles.imageResizeHandleBottom}`}
              onMouseDown={e => startResize(e, 'bottom')}
              aria-label="Cambiar alto"
            />
            <button
              type="button"
              className={`${styles.imageResizeHandle} ${styles.imageResizeHandleCorner}`}
              onMouseDown={e => startResize(e, 'bottom-right')}
              aria-label="Cambiar tamaño"
            />
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
}