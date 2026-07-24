import {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  NodeViewWrapper,
} from '@tiptap/react';

import {
  Copy,
  Trash2,
  Lock,
  Unlock,
  Captions,
  FileText,
  RotateCcw,
} from 'lucide-react';

import styles from '../ArticleEditorPage.module.css';

const MIN_WIDTH_PERCENT = 10;
const MAX_WIDTH_PERCENT = 100;

const MIN_HEIGHT_PX = 60;
const MAX_HEIGHT_PX = 1600;

const clamp = (
  value,
  min,
  max
) => {
  return Math.min(
    max,
    Math.max(min, value)
  );
};

const clampPercent = (
  value,
  fallback = 100
) => {
  const number = Number.parseFloat(
    String(value).replace('%', '')
  );

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return clamp(
    number,
    MIN_WIDTH_PERCENT,
    MAX_WIDTH_PERCENT
  );
};

const clampPx = (
  value,
  fallback = 320
) => {
  const number = Number.parseFloat(
    String(value).replace('px', '')
  );

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return clamp(
    number,
    MIN_HEIGHT_PX,
    MAX_HEIGHT_PX
  );
};

const normalizeRotation = value => {
  const number = Number.parseFloat(
    String(value).replace('deg', '')
  );

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.round(
    ((number % 360) + 360) % 360
  );
};

export default function ResizableImageView(
  props
) {
  const {
    node,
    selected,
    updateAttributes,
    deleteNode,
    editor,
    getPos,
  } = props;

  const {
    src,
    alt = '',
    width = '100%',
    height = 'auto',
    rotation = 0,
    float = 'center',
    locked = false,
    marginTop = '12px',
    marginBottom = '12px',
    caption = '',

    captionFontFamily =
      'var(--font-sans)',

    captionFontSize =
      '12px',

    captionBold = false,
    captionItalic = false,
    captionUnderline = false,

    captionColor =
      '#6b7280',

    captionAlign =
      'center',

    captionHref = '',

    href = '',
  } = node.attrs;

  const wrapperRef = useRef(null);
  const innerRef = useRef(null);

const [interaction, setInteraction] =
  useState(null);

const [
  isDragging,
  setIsDragging,
] = useState(false);

const lastDragXRef = useRef(null);
const widthNumber = clampPercent(
  width,
  100
);

const isTransforming =
  Boolean(interaction) ||
  isDragging;

  const heightNumber =
    height === 'auto'
      ? 'auto'
      : clampPx(
          height,
          320
        );

  const rotationNumber =
    normalizeRotation(rotation);

  useEffect(() => {
    if (!interaction) {
      return undefined;
    }

    document.body.style.userSelect =
      'none';

    document.body.style.cursor =
      interaction.cursor;

    const handlePointerMove =
      event => {
        if (
          interaction.type ===
          'rotate'
        ) {
          const rect =
            innerRef.current
              ?.getBoundingClientRect();

          if (!rect) {
            return;
          }

          const centerX =
            rect.left +
            rect.width / 2;

          const centerY =
            rect.top +
            rect.height / 2;

          const radians =
            Math.atan2(
              event.clientY -
                centerY,
              event.clientX -
                centerX
            );

          const degrees =
            radians *
              (180 / Math.PI) +
            90;

          updateAttributes({
            rotation:
              normalizeRotation(
                degrees
              ),
          });

          return;
        }

        const editorArea =
          wrapperRef.current
            ?.parentElement;

        const editorWidth =
          editorArea
            ?.getBoundingClientRect()
            .width || 1;

        const deltaX =
          event.clientX -
          interaction.startX;

        const deltaY =
          event.clientY -
          interaction.startY;

        const direction =
          interaction.direction;

        let nextWidth =
          interaction.startWidth;

        let nextHeight =
          interaction.startHeight;

        const horizontalDelta =
          (deltaX /
            editorWidth) *
          100;

        if (
          direction.includes('right')
        ) {
          nextWidth =
            interaction.startWidth +
            horizontalDelta;
        }

        if (
          direction.includes('left')
        ) {
          nextWidth =
            interaction.startWidth -
            horizontalDelta;
        }

        if (
          direction.includes('bottom')
        ) {
          nextHeight =
            interaction.startHeight +
            deltaY;
        }

        if (
          direction.includes('top')
        ) {
          nextHeight =
            interaction.startHeight -
            deltaY;
        }

const nextAttributes = {};

const changesWidth =
  direction.includes('left') ||
  direction.includes('right');

const changesHeight =
  direction.includes('top') ||
  direction.includes('bottom');

const isCorner =
  changesWidth &&
  changesHeight;

if (
  isCorner &&
  event.shiftKey
) {
  const widthScale =
    nextWidth /
    interaction.startWidth;

  const heightScale =
    nextHeight /
    interaction.startHeight;

  const dominantScale =
    Math.abs(widthScale - 1) >=
    Math.abs(heightScale - 1)
      ? widthScale
      : heightScale;

  const proportionalWidth =
    interaction.startWidth *
    dominantScale;

  const proportionalHeight =
    interaction.startHeight *
    dominantScale;

  nextAttributes.width =
    `${clamp(
      proportionalWidth,
      MIN_WIDTH_PERCENT,
      MAX_WIDTH_PERCENT
    )}%`;

  nextAttributes.height =
    `${clamp(
      proportionalHeight,
      MIN_HEIGHT_PX,
      MAX_HEIGHT_PX
    )}px`;
} else {
  if (changesWidth) {
    nextAttributes.width =
      `${clamp(
        nextWidth,
        MIN_WIDTH_PERCENT,
        MAX_WIDTH_PERCENT
      )}%`;
  }

  if (changesHeight) {
    nextAttributes.height =
      `${clamp(
        nextHeight,
        MIN_HEIGHT_PX,
        MAX_HEIGHT_PX
      )}px`;
  }
}

updateAttributes(
  nextAttributes
);
      };

    const finishInteraction = () => {
      setInteraction(null);

      document.body.style.userSelect =
        '';

      document.body.style.cursor =
        '';
    };

    window.addEventListener(
      'pointermove',
      handlePointerMove
    );

    window.addEventListener(
      'pointerup',
      finishInteraction
    );

    window.addEventListener(
      'pointercancel',
      finishInteraction
    );

    return () => {
      window.removeEventListener(
        'pointermove',
        handlePointerMove
      );

      window.removeEventListener(
        'pointerup',
        finishInteraction
      );

      window.removeEventListener(
        'pointercancel',
        finishInteraction
      );

      document.body.style.userSelect =
        '';

      document.body.style.cursor =
        '';
    };
  }, [
    interaction,
    updateAttributes,
  ]);

  const duplicateImage = () => {
    if (
      typeof getPos !== 'function'
    ) {
      return;
    }

    editor
      .chain()
      .focus()
      .insertContentAt(
        getPos() + node.nodeSize,
        node.toJSON()
      )
      .run();
  };

const focusCaption = () => {
  window.dispatchEvent(
    new CustomEvent(
      'agora-caption-focus',
      {
        detail: {
          type:
            'image',

          updateAttributes,

          attrs: {
            captionFontFamily,
            captionFontSize,
            captionBold,
            captionItalic,
            captionUnderline,
            captionColor,
            captionAlign,
            captionHref,
          },
        },
      }
    )
  );
};

  const editAlt = () => {
    const value = window.prompt(
      'Texto alternativo de la imagen:',
      alt || ''
    );

    if (value !== null) {
      updateAttributes({
        alt: value.trim(),
      });
    }
  };

  const getRenderedHeight = () => {
    const currentHeight =
      innerRef.current
        ?.getBoundingClientRect()
        .height;

    if (
      Number.isFinite(currentHeight) &&
      currentHeight > 0
    ) {
      return currentHeight;
    }

    if (heightNumber !== 'auto') {
      return heightNumber;
    }

    return 320;
  };

  const startResize = (
    event,
    direction,
    cursor
  ) => {
    event.preventDefault();
    event.stopPropagation();

    if (locked) {
      return;
    }

    event.currentTarget
      .setPointerCapture?.(
        event.pointerId
      );

    setInteraction({
      type: 'resize',

      direction,

      cursor,

      startX:
        event.clientX,

      startY:
        event.clientY,

      startWidth:
        widthNumber,

      startHeight:
        getRenderedHeight(),
    });
  };

const startRotation = event => {
  event.preventDefault();
  event.stopPropagation();

  if (locked) {
    return;
  }

  event.currentTarget
    .setPointerCapture?.(
      event.pointerId
    );

  setInteraction({
    type: 'rotate',
    cursor: 'grabbing',
  });
};

const handleImageDragStart = () => {
  setIsDragging(true);

  lastDragXRef.current = null;

  const handleDragOver = event => {
    lastDragXRef.current =
      event.clientX;
  };

  window.addEventListener(
    'dragover',
    handleDragOver
  );

  window.__agoraImageDragOver =
    handleDragOver;
};

const handleImageDragEnd = event => {
  setIsDragging(false);

  const handleDragOver =
    window.__agoraImageDragOver;

  if (handleDragOver) {
    window.removeEventListener(
      'dragover',
      handleDragOver
    );

    delete window.__agoraImageDragOver;
  }

  const editorElement =
    wrapperRef.current?.closest(
      '[contenteditable="true"]'
    );

  const editorRect =
    editorElement?.getBoundingClientRect();

  const dropX =
    lastDragXRef.current ??
    event.clientX;

  lastDragXRef.current = null;

  if (
    !editorRect ||
    !Number.isFinite(dropX) ||
    dropX <= 0
  ) {
    return;
  }

  const relativeX =
    dropX - editorRect.left;

  const relativePercent =
    relativeX / editorRect.width;

  let nextFloat = 'center';

  if (relativePercent < 0.38) {
    nextFloat = 'left';
  } else if (
    relativePercent > 0.62
  ) {
    nextFloat = 'right';
  }

  updateAttributes({
    float: nextFloat,
  });
};

const wrapperStyle = {
    width: `${widthNumber}%`,

    marginTop,

    marginBottom,
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
    wrapperStyle.display = 'block';
    wrapperStyle.marginLeft = 'auto';
    wrapperStyle.marginRight = 'auto';
    wrapperStyle.clear = 'both';
  }

  return (
    <NodeViewWrapper
      ref={wrapperRef}
      as="figure"
      className={`${styles.resizableImageNode} ${
        selected
          ? styles.resizableImageNodeSelected
          : ''
      } ${
        locked
          ? styles.resizableImageNodeLocked
          : ''
      } ${
        interaction
          ? styles.resizableImageNodeInteracting
          : ''
      }`}
      style={wrapperStyle}
      data-float={float}
      data-locked={
        locked
          ? 'true'
          : 'false'
      }
      data-rotation={
        rotationNumber
      }
    >
<div
  ref={innerRef}
  className={
    styles.resizableImageInner
  }
  style={{
    width: '100%',

    height:
      heightNumber === 'auto'
        ? 'auto'
        : `${heightNumber}px`,

    transform:
      `rotate(${rotationNumber}deg)`,

    transformOrigin:
      'center center',
  }}
  contentEditable={false}
  data-drag-handle
  draggable
  onDragStart={
    handleImageDragStart
  }
  onDragEnd={
    handleImageDragEnd
  }
>
{selected && (
  <div
    className={`${styles.imageFloatingToolbar} ${
      isTransforming
        ? styles.imageFloatingToolbarTransforming
        : styles.imageFloatingToolbarResting
    }`}
    contentEditable={false}
  >
<button
  type="button"
  className={
    styles.imageToolbarBtn
  }
  title="Duplicar"
  onClick={
    duplicateImage
  }
>
  <Copy size={14} />
</button>

<button
  type="button"
  className={
    styles.imageToolbarBtn
  }
  title={
    locked
      ? 'Desbloquear transformación'
      : 'Bloquear transformación'
  }
  onClick={() => {
    updateAttributes({
      locked: !locked,
    });
  }}
>
  {locked ? (
    <Unlock size={14} />
  ) : (
    <Lock size={14} />
  )}
</button>

<button
  type="button"
  className={`${styles.imageToolbarBtn} ${
    caption
      ? styles.imageToolbarBtnActive
      : ''
  }`}
  title="Editar pie de foto"
  onClick={() => {
    focusCaption();

    window.setTimeout(
      () => {
        wrapperRef.current
          ?.querySelector(
            'textarea[data-image-caption="true"]'
          )
          ?.focus();
      },
      0
    );
  }}
>
  <Captions size={14} />
</button>

<button
  type="button"
  className={`${styles.imageToolbarBtn} ${
    alt
      ? styles.imageToolbarBtnActive
      : ''
  }`}
  title="Texto alternativo"
  onClick={editAlt}
>
  <FileText size={14} />
</button>

            <button
              type="button"
              className={
                styles.imageToolbarBtn
              }
              title="Restablecer rotación"
              onClick={() => {
                updateAttributes({
                  rotation: 0,
                });
              }}
            >
              <RotateCcw size={14} />
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
          alt={
            alt ||
            'Imagen del artículo'
          }
          className={
            styles.resizableImageElement
          }
          draggable={false}
        />

        {selected && !locked && (
          <>
            <div
              className={
                styles.imageRotateStem
              }
            />

            <button
              type="button"
              className={
                styles.imageRotateHandle
              }
              onPointerDown={
                startRotation
              }
              aria-label="Rotar imagen"
              title={`Rotar: ${rotationNumber}°`}
            >
              <RotateCcw size={16} />
            </button>

            <button
              type="button"
              className={`${styles.imageResizeHandle} ${styles.imageResizeHandleTopLeft}`}
              onPointerDown={event => {
                startResize(
                  event,
                  'top-left',
                  'nwse-resize'
                );
              }}
              aria-label="Redimensionar desde arriba a la izquierda"
            />

            <button
              type="button"
              className={`${styles.imageResizeHandle} ${styles.imageResizeHandleTop}`}
              onPointerDown={event => {
                startResize(
                  event,
                  'top',
                  'ns-resize'
                );
              }}
              aria-label="Cambiar alto desde arriba"
            />

            <button
              type="button"
              className={`${styles.imageResizeHandle} ${styles.imageResizeHandleTopRight}`}
              onPointerDown={event => {
                startResize(
                  event,
                  'top-right',
                  'nesw-resize'
                );
              }}
              aria-label="Redimensionar desde arriba a la derecha"
            />

            <button
              type="button"
              className={`${styles.imageResizeHandle} ${styles.imageResizeHandleRight}`}
              onPointerDown={event => {
                startResize(
                  event,
                  'right',
                  'ew-resize'
                );
              }}
              aria-label="Cambiar ancho desde la derecha"
            />

            <button
              type="button"
              className={`${styles.imageResizeHandle} ${styles.imageResizeHandleBottomRight}`}
              onPointerDown={event => {
                startResize(
                  event,
                  'bottom-right',
                  'nwse-resize'
                );
              }}
              aria-label="Redimensionar desde abajo a la derecha"
            />

            <button
              type="button"
              className={`${styles.imageResizeHandle} ${styles.imageResizeHandleBottom}`}
              onPointerDown={event => {
                startResize(
                  event,
                  'bottom',
                  'ns-resize'
                );
              }}
              aria-label="Cambiar alto desde abajo"
            />

            <button
              type="button"
              className={`${styles.imageResizeHandle} ${styles.imageResizeHandleBottomLeft}`}
              onPointerDown={event => {
                startResize(
                  event,
                  'bottom-left',
                  'nesw-resize'
                );
              }}
              aria-label="Redimensionar desde abajo a la izquierda"
            />

            <button
              type="button"
              className={`${styles.imageResizeHandle} ${styles.imageResizeHandleLeft}`}
              onPointerDown={event => {
                startResize(
                  event,
                  'left',
                  'ew-resize'
                );
              }}
              aria-label="Cambiar ancho desde la izquierda"
            />
          </>
        )}
      </div>

      {(selected || caption) && (
        <div
          className={
            styles.imageCaptionEditor
          }
          contentEditable={false}
          onMouseDown={event => {
            event.stopPropagation();
          }}
          onClick={event => {
            event.stopPropagation();
          }}
        >
          <textarea
            data-image-caption="true"
            value={
              caption
            }
            onFocus={
              focusCaption
            }
            onChange={event => {
              updateAttributes({
                caption:
                  event.target.value,
              });
            }}
            placeholder="Escribe un pie de foto o crédito..."
            className={
              styles.imageCaptionInput
            }
            style={{
              fontFamily:
                captionFontFamily,

              fontSize:
                captionFontSize,

              fontWeight:
                captionBold
                  ? 700
                  : 400,

              fontStyle:
                captionItalic
                  ? 'italic'
                  : 'normal',

              textDecoration:
                captionUnderline
                  ? 'underline'
                  : 'none',

              color:
                captionColor,

              textAlign:
                captionAlign,
            }}
            rows={2}
            maxLength={500}
          />

          <span
            className={
              styles.imageCaptionCount
            }
          >
            {caption.length}/500
          </span>
        </div>
      )}
    </NodeViewWrapper>
  );
}