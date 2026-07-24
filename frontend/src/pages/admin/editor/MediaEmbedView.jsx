import {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  NodeViewWrapper,
} from '@tiptap/react';

import {
  Trash2,
  ExternalLink,
  Lock,
  Unlock,
  RotateCcw,
} from 'lucide-react';

import styles from '../ArticleEditorPage.module.css';

const MIN_WIDTH_PERCENT = 10;
const MAX_WIDTH_PERCENT = 100;

const MIN_HEIGHT_PX = 80;
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
  fallback = 360
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

export default function MediaEmbedView({
  node,
  selected,
  updateAttributes,
  deleteNode,
}) {
  const {
    provider = 'video',
    src = '',
    originalUrl = '',
    title = '',
    width = '100%',
    height = 'auto',
    rotation = 0,
    align = 'center',
    locked = false,
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
  } = node.attrs;

  const wrapperRef = useRef(null);
  const frameRef = useRef(null);

  const lastDragXRef = useRef(null);

  const [
    interaction,
    setInteraction,
  ] = useState(null);

  const widthValue =
    clampPercent(
      width,
      100
    );

  const heightValue =
    height === 'auto'
      ? 'auto'
      : clampPx(
          height,
          360
        );

  const rotationValue =
    normalizeRotation(
      rotation
    );

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
            frameRef.current
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

        const editorElement =
          wrapperRef.current?.closest(
            '[contenteditable="true"]'
          );

        const editorWidth =
          editorElement
            ?.getBoundingClientRect()
            .width || 1;

        const deltaX =
          event.clientX -
          interaction.startX;

        const deltaY =
          event.clientY -
          interaction.startY;

        const horizontalDelta =
          (
            deltaX /
            editorWidth
          ) * 100;

        const direction =
          interaction.direction;

        const attributes = {};

        if (
          direction.includes('right')
        ) {
          attributes.width =
            `${clamp(
              interaction.startWidth +
                horizontalDelta,
              MIN_WIDTH_PERCENT,
              MAX_WIDTH_PERCENT
            )}%`;
        }

        if (
          direction.includes('left')
        ) {
          attributes.width =
            `${clamp(
              interaction.startWidth -
                horizontalDelta,
              MIN_WIDTH_PERCENT,
              MAX_WIDTH_PERCENT
            )}%`;
        }

        if (
          direction.includes('bottom')
        ) {
          attributes.height =
            `${clamp(
              interaction.startHeight +
                deltaY,
              MIN_HEIGHT_PX,
              MAX_HEIGHT_PX
            )}px`;
        }

        if (
          direction.includes('top')
        ) {
          attributes.height =
            `${clamp(
              interaction.startHeight -
                deltaY,
              MIN_HEIGHT_PX,
              MAX_HEIGHT_PX
            )}px`;
        }

        updateAttributes(
          attributes
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

  const getRenderedHeight = () => {
    const currentHeight =
      frameRef.current
        ?.getBoundingClientRect()
        .height;

    if (
      Number.isFinite(currentHeight) &&
      currentHeight > 0
    ) {
      return currentHeight;
    }

    if (heightValue !== 'auto') {
      return heightValue;
    }

    return 360;
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
        widthValue,

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

  const handleMediaDragStart = () => {
    lastDragXRef.current = null;

    const handleDragOver = event => {
      lastDragXRef.current =
        event.clientX;
    };

    window.addEventListener(
      'dragover',
      handleDragOver
    );

    window.__agoraMediaDragOver =
      handleDragOver;
  };

  const handleMediaDragEnd = event => {
    const handleDragOver =
      window.__agoraMediaDragOver;

    if (handleDragOver) {
      window.removeEventListener(
        'dragover',
        handleDragOver
      );

      delete window.__agoraMediaDragOver;
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

    let nextAlign = 'center';

    if (relativePercent < 0.38) {
      nextAlign = 'left';
    } else if (
      relativePercent > 0.62
    ) {
      nextAlign = 'right';
    }

    updateAttributes({
      align: nextAlign,
    });
  };

  const wrapperStyle = {
    width:
      `${widthValue}%`,
  };

  if (align === 'left') {
    wrapperStyle.float = 'left';
    wrapperStyle.marginLeft = '0';
    wrapperStyle.marginRight = '18px';
  } else if (
    align === 'right'
  ) {
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
      className={`${styles.mediaNode} ${
        selected
          ? styles.mediaNodeSelected
          : ''
      } ${
        locked
          ? styles.mediaNodeLocked
          : ''
      } ${
        interaction
          ? styles.mediaNodeInteracting
          : ''
      }`}
      style={wrapperStyle}
      data-provider={provider}
      data-align={align}
      data-rotation={
        rotationValue
      }
      data-locked={
        locked
          ? 'true'
          : 'false'
      }
    >
      {selected && (
        <div
          className={
            styles.mediaFloatingToolbar
          }
          contentEditable={false}
        >
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

          {originalUrl && (
            <a
              href={originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={
                styles.imageToolbarBtn
              }
              title="Abrir publicación original"
            >
              <ExternalLink size={14} />
            </a>
          )}

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

      <div
        ref={frameRef}
        className={styles.mediaFrame}
        contentEditable={false}
        data-drag-handle
        draggable
        onDragStart={
          handleMediaDragStart
        }
        onDragEnd={
          handleMediaDragEnd
        }
        style={{
          height:
            heightValue === 'auto'
              ? undefined
              : `${heightValue}px`,

          aspectRatio:
            heightValue === 'auto'
              ? '16 / 9'
              : 'auto',

          transform:
            `rotate(${rotationValue}deg)`,

          transformOrigin:
            'center center',
        }}
      >
        {provider === 'video' ? (
          <video
            src={src}
            controls
            preload="metadata"
            playsInline
            title={
              title ||
              'Video del artículo'
            }
            draggable={false}
          />
        ) : (
          <iframe
            src={src}
            title={
              title ||
              `Contenido de ${provider}`
            }
            loading="lazy"
            allow={[
              'accelerometer',
              'autoplay',
              'clipboard-write',
              'encrypted-media',
              'gyroscope',
              'picture-in-picture',
              'web-share',
            ].join('; ')}
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        )}

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
              aria-label="Rotar video"
              title={`Rotar: ${rotationValue}°`}
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
            />
          </>
        )}
      </div>

      {(selected || caption) && (
        <div
          className={
            styles.mediaCaptionEditor
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
            value={caption}
            onFocus={() => {
              window.dispatchEvent(
                new CustomEvent(
                  'agora-caption-focus',
                  {
                    detail: {
                      type:
                        'media',

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
            }}
            onChange={event => {
              const nextCaption =
                event.target.value;

              updateAttributes({
                caption:
                  nextCaption,
              });
            }}
            placeholder="Escribe un pie de video o crédito..."
            className={
              styles.mediaCaptionInput
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
              styles.mediaCaptionCount
            }
          >
            {caption.length}/500
          </span>
        </div>
           )}
    </NodeViewWrapper>
  );
} 