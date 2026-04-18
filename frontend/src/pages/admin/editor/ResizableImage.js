import Image from '@tiptap/extension-image';
import { mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import ResizableImageView from './ResizableImageView.jsx';

const clampPercent = (value, fallback = 100) => {
  const num = Number.parseFloat(String(value).replace('%', ''));
  if (!Number.isFinite(num)) return `${fallback}%`;
  return `${Math.min(100, Math.max(15, num))}%`;
};

const clampPx = (value, fallback = 320) => {
  const num = Number.parseFloat(String(value).replace('px', ''));
  if (!Number.isFinite(num)) return `${fallback}px`;
  return `${Math.min(1600, Math.max(80, num))}px`;
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
        parseHTML: element => element.getAttribute('data-width') || element.style.width || '100%',
        renderHTML: attributes => ({
          'data-width': clampPercent(attributes.width, 100),
        }),
      },
      height: {
        default: 'auto',
        parseHTML: element => element.getAttribute('data-height') || element.style.height || 'auto',
        renderHTML: attributes => ({
          'data-height': attributes.height === 'auto' ? 'auto' : clampPx(attributes.height, 320),
        }),
      },
      float: {
        default: 'center',
        parseHTML: element => element.getAttribute('data-float') || 'center',
        renderHTML: attributes => ({
          'data-float': attributes.float || 'center',
        }),
      },
      locked: {
        default: false,
        parseHTML: element => element.getAttribute('data-locked') === 'true',
        renderHTML: attributes => ({
          'data-locked': attributes.locked ? 'true' : 'false',
        }),
      },
      marginTop: {
        default: '12px',
        parseHTML: element => element.getAttribute('data-margin-top') || '12px',
        renderHTML: attributes => ({
          'data-margin-top': attributes.marginTop || '12px',
        }),
      },
      marginBottom: {
        default: '12px',
        parseHTML: element => element.getAttribute('data-margin-bottom') || '12px',
        renderHTML: attributes => ({
          'data-margin-bottom': attributes.marginBottom || '12px',
        }),
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
    };
  },

  renderHTML({ HTMLAttributes }) {
    const width = clampPercent(HTMLAttributes.width, 100);
    const height =
      HTMLAttributes.height && HTMLAttributes.height !== 'auto'
        ? clampPx(HTMLAttributes.height, 320)
        : 'auto';

    const float = HTMLAttributes.float || 'center';
    const locked = HTMLAttributes.locked ? 'true' : 'false';
    const marginTop = HTMLAttributes.marginTop || '12px';
    const marginBottom = HTMLAttributes.marginBottom || '12px';

    let wrapperStyle = `margin-top:${marginTop}; margin-bottom:${marginBottom};`;
    let imageStyle = `width:${width}; height:${height};`;

    if (float === 'left') {
      wrapperStyle += ' float:left; margin-right:18px; margin-left:0;';
      imageStyle += ' display:block;';
    } else if (float === 'right') {
      wrapperStyle += ' float:right; margin-left:18px; margin-right:0;';
      imageStyle += ' display:block;';
    } else {
      wrapperStyle += ' display:flex; justify-content:center; clear:both;';
      imageStyle += ' display:block;';
    }

    return [
      'figure',
      mergeAttributes(
        {
          class: 'article-image-node',
          'data-float': float,
          'data-locked': locked,
          style: wrapperStyle,
        },
      ),
      [
        'img',
        mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
          style: imageStyle,
        }),
      ],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView);
  },
});

export default ResizableImage;