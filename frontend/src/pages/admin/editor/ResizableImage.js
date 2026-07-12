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
      href,
      ...rest
    } = HTMLAttributes;

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
        rest,
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
      children.push([
        'figcaption',
        {},
        caption,
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