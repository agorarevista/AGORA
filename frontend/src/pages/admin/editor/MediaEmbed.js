import {
  Node,
  mergeAttributes,
} from '@tiptap/core';

import {
  ReactNodeViewRenderer,
} from '@tiptap/react';

import MediaEmbedView from './MediaEmbedView.jsx';

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
  fallback = 360
) => {
  const number = Number.parseFloat(
    String(value).replace('px', '')
  );

  if (!Number.isFinite(number)) {
    return `${fallback}px`;
  }

  return `${Math.min(
    1600,
    Math.max(80, number)
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

const MediaEmbed = Node.create({
  name: 'mediaEmbed',

  group: 'block',

  atom: true,

  draggable: true,

  selectable: true,

  addAttributes() {
    return {
      provider: {
        default: 'video',

        parseHTML: element => {
          return (
            element.getAttribute(
              'data-provider'
            ) ||
            'video'
          );
        },
      },

      src: {
        default: '',
      },

      originalUrl: {
        default: '',

        parseHTML: element => {
          return (
            element.getAttribute(
              'data-original-url'
            ) ||
            ''
          );
        },
      },

      title: {
        default: '',
      },

      width: {
        default: '100%',

        parseHTML: element => {
          return (
            element.getAttribute(
              'data-width'
            ) ||
            '100%'
          );
        },

        renderHTML: attributes => {
          return {
            'data-width':
              clampPercent(
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
            element.getAttribute(
              'data-height'
            ) ||
            'auto'
          );
        },

        renderHTML: attributes => {
          return {
            'data-height':
              attributes.height ===
              'auto'
                ? 'auto'
                : clampPx(
                    attributes.height,
                    360
                  ),
          };
        },
      },

      rotation: {
        default: 0,

        parseHTML: element => {
          return clampRotation(
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

      align: {
        default: 'center',

        parseHTML: element => {
          return (
            element.getAttribute(
              'data-align'
            ) ||
            'center'
          );
        },

        renderHTML: attributes => {
          return {
            'data-align':
              attributes.align ||
              'center',
          };
        },
      },

locked: {
  default: false,

  parseHTML: element => {
    return (
      element.getAttribute(
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

caption: {
  default: '',

  parseHTML: element => {
    return (
      element.querySelector(
        'figcaption'
      )?.textContent ||
      ''
    );
  },

  renderHTML: () => {
    return {};
  },
},
    };
  },

  parseHTML() {
    return [
      {
        tag:
          'figure.article-media-node',
      },
    ];
  },

  renderHTML({
    HTMLAttributes,
  }) {
const {
  provider,
  src,
  originalUrl,
  title,
  width,
  height,
  rotation,
  align,
  locked,
  caption,
  ...rest
} = HTMLAttributes;

    const safeWidth =
      clampPercent(
        width,
        100
      );

    const safeHeight =
      height &&
      height !== 'auto'
        ? clampPx(
            height,
            360
          )
        : 'auto';

    const safeRotation =
      clampRotation(rotation);

    const figureStyle = [
      `width:${safeWidth}`,

      'margin-top:24px',

      'margin-bottom:24px',
    ];

    if (align === 'left') {
      figureStyle.push(
        'float:left',
        'margin-left:0',
        'margin-right:18px'
      );
    } else if (align === 'right') {
      figureStyle.push(
        'float:right',
        'margin-left:18px',
        'margin-right:0'
      );
    } else {
      figureStyle.push(
        'display:block',
        'margin-left:auto',
        'margin-right:auto',
        'clear:both'
      );
    }

    const mediaStyle = [
      'display:block',
      'width:100%',
      `height:${safeHeight}`,
      safeHeight === 'auto'
        ? 'aspect-ratio:16/9'
        : '',
      `transform:rotate(${safeRotation}deg)`,
      'transform-origin:center center',
    ]
      .filter(Boolean)
      .join(';');

    const media =
      provider === 'video'
        ? [
            'video',

            {
              src,

              controls: 'true',

              preload: 'metadata',

              playsinline: 'true',

              title:
                title ||
                'Video del artículo',

              style:
                mediaStyle,
            },
          ]
        : [
            'iframe',

            {
              src,

              title:
                title ||
                `Contenido de ${provider}`,

              loading: 'lazy',

              allow: [
                'accelerometer',
                'autoplay',
                'clipboard-write',
                'encrypted-media',
                'gyroscope',
                'picture-in-picture',
                'web-share',
              ].join('; '),

              allowfullscreen: 'true',

              referrerpolicy:
                'strict-origin-when-cross-origin',

              style:
                mediaStyle,
            },
          ];

    return [
      'figure',

      mergeAttributes(
        rest,
        {
          class:
            'article-media-node',

          'data-provider':
            provider,

          'data-original-url':
            originalUrl || '',

          'data-width':
            safeWidth,

          'data-height':
            safeHeight,

          'data-rotation':
            safeRotation,

          'data-align':
            align || 'center',

          'data-locked':
            locked
              ? 'true'
              : 'false',

          style:
            figureStyle.join(';'),
        }
      ),

      media,

      ...(caption
        ? [
            [
              'figcaption',
              {},
              caption,
            ],
          ]
        : []),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(
      MediaEmbedView
    );
  },
});

export default MediaEmbed;