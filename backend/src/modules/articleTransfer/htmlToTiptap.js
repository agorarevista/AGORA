const cheerio =
  require('cheerio');

const normalizeText = value => {
  return String(value || '')
    .replace(/\u00a0/g, ' ');
};

const getTextMarks = element => {
  const marks = [];

  let current =
    element?.parent;

  while (current) {
    const tagName =
      String(
        current.name || ''
      ).toLowerCase();

    if (
      tagName === 'strong' ||
      tagName === 'b'
    ) {
      marks.push({
        type: 'bold',
      });
    }

    if (
      tagName === 'em' ||
      tagName === 'i'
    ) {
      marks.push({
        type: 'italic',
      });
    }

    if (tagName === 'u') {
      marks.push({
        type: 'underline',
      });
    }

    if (
      tagName === 's' ||
      tagName === 'strike' ||
      tagName === 'del'
    ) {
      marks.push({
        type: 'strike',
      });
    }

    if (
      tagName === 'a' &&
      current.attribs?.href
    ) {
      marks.push({
        type: 'link',

        attrs: {
          href:
            current.attribs.href,

          target: '_blank',

          rel:
            'noopener noreferrer',

          class:
            'editor-link',
        },
      });
    }

    current =
      current.parent;
  }

  return marks;
};

const inlineNodes = (
  $,
  element
) => {
  const result = [];

  $(element)
    .contents()
    .each((_, child) => {
      if (child.type === 'text') {
        const text =
          normalizeText(child.data);

        if (!text) {
          return;
        }

        const node = {
          type: 'text',
          text,
        };

        const marks =
          getTextMarks(child);

        if (marks.length > 0) {
          node.marks = marks;
        }

        result.push(node);

        return;
      }

      const tagName =
        String(
          child.name || ''
        ).toLowerCase();

      if (tagName === 'br') {
        result.push({
          type: 'hardBreak',
        });

        return;
      }

      result.push(
        ...inlineNodes(
          $,
          child
        )
      );
    });

  return result;
};

const parseImageNode = (
  $,
  element
) => {
  const image =
    $(element);

  const src =
    image.attr('src') ||
    image.attr('data-src') ||
    '';

  if (!src) {
    return null;
  }

  const figure =
    image.closest('figure');

  const caption =
    figure
      .find('figcaption')
      .first()
      .text()
      .trim();

  const width =
    image.attr('width') ||
    '100%';

  const height =
    image.attr('height') ||
    'auto';

  return {
    type: 'image',

    attrs: {
      src,

      alt:
        image.attr('alt') ||
        '',

      title:
        image.attr('title') ||
        null,

      width:
        String(width).includes('%')
          ? String(width)
          : '100%',

      height:
        height || 'auto',

      rotation: 0,

      float: 'center',

      locked: false,

      marginTop: '12px',

      marginBottom: '12px',

      caption,

      href:
        image
          .closest('a')
          .attr('href') ||
        '',
    },
  };
};

const blockNodes = (
  $,
  root
) => {
  const nodes = [];

  $(root)
    .children()
    .each((_, element) => {
      const tagName =
        String(
          element.name || ''
        ).toLowerCase();

      if (
        tagName === 'script' ||
        tagName === 'style' ||
        tagName === 'noscript'
      ) {
        return;
      }

      if (
        tagName === 'p' ||
        tagName === 'div'
      ) {
        const directImages =
          $(element)
            .find('img')
            .toArray();

        const hasSubstantialText =
          $(element)
            .clone()
            .find('img, figure')
            .remove()
            .end()
            .text()
            .trim()
            .length > 0;

        if (
          directImages.length > 0 &&
          !hasSubstantialText
        ) {
          directImages.forEach(
            imageElement => {
              const imageNode =
                parseImageNode(
                  $,
                  imageElement
                );

              if (imageNode) {
                nodes.push(
                  imageNode
                );
              }
            }
          );

          return;
        }

        const content =
          inlineNodes(
            $,
            element
          );

        if (
          content.length > 0 ||
          tagName === 'p'
        ) {
          nodes.push({
            type: 'paragraph',
            content,
          });
        }

        return;
      }

      if (/^h[1-6]$/.test(tagName)) {
        const level =
          Math.min(
            3,
            Number(
              tagName.slice(1)
            )
          );

        nodes.push({
          type: 'heading',

          attrs: {
            level,
            textAlign: null,
          },

          content:
            inlineNodes(
              $,
              element
            ),
        });

        return;
      }

      if (tagName === 'blockquote') {
        nodes.push({
          type: 'blockquote',

          content: [
            {
              type: 'paragraph',

              content:
                inlineNodes(
                  $,
                  element
                ),
            },
          ],
        });

        return;
      }

      if (tagName === 'hr') {
        nodes.push({
          type: 'horizontalRule',
        });

        return;
      }

      if (
        tagName === 'pre'
      ) {
        nodes.push({
          type: 'codeBlock',

          attrs: {
            language: null,
          },

          content: [
            {
              type: 'text',

              text:
                $(element)
                  .text() ||
                ' ',
            },
          ],
        });

        return;
      }

      if (
        tagName === 'ul' ||
        tagName === 'ol'
      ) {
        const listItems = [];

        $(element)
          .children('li')
          .each((__, item) => {
            listItems.push({
              type: 'listItem',

              content: [
                {
                  type:
                    'paragraph',

                  content:
                    inlineNodes(
                      $,
                      item
                    ),
                },
              ],
            });
          });

        nodes.push({
          type:
            tagName === 'ul'
              ? 'bulletList'
              : 'orderedList',

          attrs:
            tagName === 'ul'
              ? {
                  listStyleType:
                    null,
                }
              : {
                  start:
                    Number(
                      $(element)
                        .attr(
                          'start'
                        ) ||
                      1
                    ),

                  type: null,

                  listStyleType:
                    null,
                },

          content:
            listItems,
        });

        return;
      }

      if (
        tagName === 'figure'
      ) {
        const imageElement =
          $(element)
            .find('img')
            .first()[0];

        if (imageElement) {
          const imageNode =
            parseImageNode(
              $,
              imageElement
            );

          if (imageNode) {
            nodes.push(
              imageNode
            );
          }
        }

        return;
      }

      if (tagName === 'img') {
        const imageNode =
          parseImageNode(
            $,
            element
          );

        if (imageNode) {
          nodes.push(
            imageNode
          );
        }

        return;
      }

      const nested =
        blockNodes(
          $,
          element
        );

      nodes.push(...nested);
    });

  return nodes;
};

const htmlToTiptap = html => {
  const $ =
    cheerio.load(
      `<div id="agora-import-root">${html || ''}</div>`,
      null,
      false
    );

  const content =
    blockNodes(
      $,
      '#agora-import-root'
    );

  return {
    type: 'doc',

    content:
      content.length > 0
        ? content
        : [
            {
              type: 'paragraph',
            },
          ],
  };
};

module.exports = {
  htmlToTiptap,
};