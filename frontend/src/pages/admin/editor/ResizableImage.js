import Image from '@tiptap/extension-image';
import { mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';

import ResizableImageView from './ResizableImageView.jsx';

const clampPercent = (
  value,
  fallback = 100
) => {
  const number = Number.parseFloat(
    String(value).replace('%', '')
  );

  if (!Number.isFinite(number)) {
    return `${fallback}%`;
  }

  return `${Math.min(
    100,
    Math.max(10, number)
  )}%`;
};

const clampPx = (
  value,
  fallback = 320
) => {
  const number = Number.parseFloat(
    String(value).replace('px', '')
  );

  if (!Number.isFinite(number)) {
    return `${fallback}px`;
  }

  return `${Math.min(
    1600,
    Math.max(60, number)
  )}px`;
};

const clampRotation = value => {
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

const ResizableImage = Image.extend({
  name: 'image',

  inline() {
    return false;
  },

  group() {
    return 'block';
  },

  draggable: true,

  addAttributes() {
    return {
      ...this.parent?.(),

      width: {
        default: '100%',

        parseHTML: element => {
          return (
            element
              .closest('figure')
              ?.getAttribute('data-width') ||
            element.getAttribute('data-width') ||
            element.style.width ||
            '100%'
          );
        },

        renderHTML: attributes => {
          return {
            'data-width': clampPercent(
              attributes.width,
              100
            ),
          };
        },
      },

      height: {
        default: 'auto',

        parseHTML: element => {
          return (
            element
              .closest('figure')
              ?.getAttribute('data-height') ||
            element.getAttribute('data-height') ||
            element.style.height ||
            'auto'
          );
        },

        renderHTML: attributes => {
          return {
            'data-height':
              attributes.height === 'auto'
                ? 'auto'
                : clampPx(
                    attributes.height,
                    320
                  ),
          };
        },
      },

      rotation: {
        default: 0,

        parseHTML: element => {
          return clampRotation(
            element
              .closest('figure')
              ?.getAttribute(
                'data-rotation'
              ) ||
            element.getAttribute(
              'data-rotation'
            ) ||
            0
          );
        },

        renderHTML: attributes => {
          return {
            'data-rotation':
              clampRotation(
                attributes.rotation
              ),
          };
        },
      },

      float: {
        default: 'center',

        parseHTML: element => {
          return (
            element
              .closest('figure')
              ?.getAttribute('data-float') ||
            'center'
          );
        },

        renderHTML: attributes => {
          return {
            'data-float':
              attributes.float || 'center',
          };
        },
      },

      locked: {
        default: false,

        parseHTML: element => {
          return (
            element
              .closest('figure')
              ?.getAttribute(
                'data-locked'
              ) === 'true'
          );
        },

        renderHTML: attributes => {
          return {
            'data-locked':
              attributes.locked
                ? 'true'
                : 'false',
          };
        },
      },

      marginTop: {
        default: '12px',

        parseHTML: element => {
          return (
            element
              .closest('figure')
              ?.getAttribute(
                'data-margin-top'
              ) ||
            '12px'
          );
        },

        renderHTML: attributes => {
          return {
            'data-margin-top':
              attributes.marginTop ||
              '12px',
          };
        },
      },

      marginBottom: {
        default: '12px',

        parseHTML: element => {
          return (
            element
              .closest('figure')
              ?.getAttribute(
                'data-margin-bottom'
              ) ||
            '12px'
          );
        },

        renderHTML: attributes => {
          return {
            'data-margin-bottom':
              attributes.marginBottom ||
              '12px',
          };
        },
      },

      caption: {
        default: '',

        parseHTML: element => {
          return (
            element
              .closest('figure')
              ?.querySelector(
                'figcaption'
              )
              ?.textContent ||
            ''
          );
        },

        renderHTML: () => {
          return {};
        },
      },

      captionFontFamily: {
        default:
          'var(--font-sans)',

        parseHTML: element => {
          const figcaption =
            element
              .closest('figure')
              ?.querySelector(
                'figcaption'
              );

          return (
            figcaption?.style
              ?.fontFamily ||
            'var(--font-sans)'
          );
        },

        renderHTML: () => {
          return {};
        },
      },

      captionFontSize: {
        default: '12px',

        parseHTML: element => {
          const figcaption =
            element
              .closest('figure')
              ?.querySelector(
                'figcaption'
              );

          return (
            figcaption?.style
              ?.fontSize ||
            '12px'
          );
        },

        renderHTML: () => {
          return {};
        },
      },

      captionBold: {
        default: false,

        parseHTML: element => {
          const fontWeight =
            element
              .closest('figure')
              ?.querySelector(
                'figcaption'
              )
              ?.style
              ?.fontWeight;

          return (
            fontWeight === '700' ||
            fontWeight === 'bold'
          );
        },

        renderHTML: () => {
          return {};
        },
      },

      captionItalic: {
        default: false,

        parseHTML: element => {
          return (
            element
              .closest('figure')
              ?.querySelector(
                'figcaption'
              )
              ?.style
              ?.fontStyle ===
            'italic'
          );
        },

        renderHTML: () => {
          return {};
        },
      },

      captionUnderline: {
        default: false,

        parseHTML: element => {
          const decoration =
            element
              .closest('figure')
              ?.querySelector(
                'figcaption'
              )
              ?.style
              ?.textDecoration ||
            '';

          return decoration.includes(
            'underline'
          );
        },

        renderHTML: () => {
          return {};
        },
      },

      captionColor: {
        default: '#6b7280',

        parseHTML: element => {
          return (
            element
              .closest('figure')
              ?.querySelector(
                'figcaption'
              )
              ?.style
              ?.color ||
            '#6b7280'
          );
        },

        renderHTML: () => {
          return {};
        },
      },

      captionAlign: {
        default: 'center',

        parseHTML: element => {
          return (
            element
              .closest('figure')
              ?.querySelector(
                'figcaption'
              )
              ?.style
              ?.textAlign ||
            'center'
          );
        },

        renderHTML: () => {
          return {};
        },
      },

      captionHref: {
        default: '',

        parseHTML: element => {
          return (
            element
              .closest('figure')
              ?.querySelector(
                'figcaption a'
              )
              ?.getAttribute(
                'href'
              ) ||
            ''
          );
        },

        renderHTML: () => {
          return {};
        },
      },

      href: {
        default: '',

        parseHTML: element => {
          return (
            element
              .closest('a')
              ?.getAttribute('href') ||
            ''
          );
        },

        renderHTML: () => {
          return {};
        },
      },

      alt: {
        default: '',
      },

      title: {
        default: '',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'figure.article-image-node img',
      },

      {
        tag: 'img[src]',
      },
    ];
  },

  renderHTML({
    node,
    HTMLAttributes,
  }) {
    const {
      src,
      alt,
      title,
      width,
      height,
      rotation,
      float,
      locked,
      marginTop,
      marginBottom,
      caption,
      captionFontFamily,
      captionFontSize,
      captionBold,
      captionItalic,
      captionUnderline,
      captionColor,
      captionAlign,
      captionHref,
      href,
    } = node.attrs;

    const safeWidth = clampPercent(
      width,
      100
    );

    const safeHeight =
      height &&
      height !== 'auto'
        ? clampPx(
            height,
            320
          )
        : 'auto';

    const safeRotation =
      clampRotation(rotation);

    const wrapperStyle = [
      `width:${safeWidth}`,

      `margin-top:${
        marginTop || '12px'
      }`,

      `margin-bottom:${
        marginBottom || '12px'
      }`,
    ];

    if (float === 'left') {
      wrapperStyle.push(
        'float:left',
        'margin-right:18px',
        'margin-left:0'
      );
    } else if (float === 'right') {
      wrapperStyle.push(
        'float:right',
        'margin-left:18px',
        'margin-right:0'
      );
    } else {
      wrapperStyle.push(
        'display:block',
        'margin-left:auto',
        'margin-right:auto',
        'clear:both'
      );
    }

    const imageAttributes =
      mergeAttributes(
        this.options.HTMLAttributes,
        HTMLAttributes,
        {
          src,

          alt: alt || '',

          title:
            title || null,

          style: [
            'width:100%',

            `height:${safeHeight}`,

            'display:block',

            'object-fit:fill',
          ].join(';'),
        }
      );

    const imageContent = href
      ? [
          'a',

          {
            href,

            target: '_blank',

            rel: 'noopener noreferrer',

            style: [
              'display:block',

              `transform:rotate(${safeRotation}deg)`,

              'transform-origin:center center',
            ].join(';'),
          },

          [
            'img',
            imageAttributes,
          ],
        ]
      : [
          'div',

          {
            style: [
              'display:block',

              `transform:rotate(${safeRotation}deg)`,

              'transform-origin:center center',
            ].join(';'),
          },

          [
            'img',
            imageAttributes,
          ],
        ];

    const children = [
      imageContent,
    ];

    if (caption) {
      const captionStyle = [
        `font-family:${
          captionFontFamily ||
          'var(--font-sans)'
        }`,

        `font-size:${
          captionFontSize ||
          '12px'
        }`,

        `font-weight:${
          captionBold
            ? '700'
            : '400'
        }`,

        `font-style:${
          captionItalic
            ? 'italic'
            : 'normal'
        }`,

        `text-decoration:${
          captionUnderline
            ? 'underline'
            : 'none'
        }`,

        `color:${
          captionColor ||
          '#6b7280'
        }`,

        `text-align:${
          captionAlign ||
          'center'
        }`,

        'line-height:1.5',

        'margin-top:8px',

        'width:100%',
      ].join(';');

      const captionContent =
        captionHref
          ? [
              'a',

              {
                href:
                  captionHref,

                target:
                  '_blank',

                rel:
                  'noopener noreferrer',
              },

              caption,
            ]
          : caption;

      children.push([
        'figcaption',

        {
          class:
            'article-image-caption',

          style:
            captionStyle,
        },

        captionContent,
      ]);
    }

    return [
      'figure',

      {
        class:
          'article-image-node',

        'data-width':
          safeWidth,

        'data-height':
          safeHeight,

        'data-rotation':
          safeRotation,

        'data-float':
          float || 'center',

        'data-locked':
          locked
            ? 'true'
            : 'false',

        'data-margin-top':
          marginTop || '12px',

        'data-margin-bottom':
          marginBottom || '12px',

        style:
          wrapperStyle.join(';'),
      },

      ...children,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(
      ResizableImageView
    );
  },
});

export default ResizableImage;