const AdmZip =
  require('adm-zip');

const cheerio =
  require('cheerio');

const supabase =
  require('../../config/supabase');

const {
  slugify,
} = require('../../utils/slugify');

const {
  readingTime,
} = require('../../utils/readingTime');

const {
  uploadBuffer,
} = require('../upload/upload.service');

const {
  htmlToTiptap,
} = require('./htmlToTiptap');

const escapeXml = value => {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

const escapeCdata = value => {
  return String(value ?? '')
    .replace(
      /\]\]>/g,
      ']]]]><![CDATA[>'
    );
};

const parseBoolean = (
  value,
  fallback = false
) => {
  if (
    value === true ||
    value === 'true' ||
    value === '1'
  ) {
    return true;
  }

  if (
    value === false ||
    value === 'false' ||
    value === '0'
  ) {
    return false;
  }

  return fallback;
};

const normalizeArray = value => {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (!value) {
    return [];
  }

  try {
    const parsed =
      JSON.parse(value);

    return Array.isArray(parsed)
      ? parsed.filter(Boolean)
      : [];
  } catch {
    return String(value)
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);
  }
};

const parseCsv = text => {
  const rows = [];

  let row = [];
  let value = '';
  let quoted = false;

  const source =
    String(text || '');

  for (
    let index = 0;
    index < source.length;
    index += 1
  ) {
    const char =
      source[index];

    const next =
      source[index + 1];

    if (
      char === '"' &&
      quoted &&
      next === '"'
    ) {
      value += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      quoted = !quoted;
      continue;
    }

    if (
      char === ',' &&
      !quoted
    ) {
      row.push(value);
      value = '';
      continue;
    }

    if (
      (
        char === '\n' ||
        char === '\r'
      ) &&
      !quoted
    ) {
      if (
        char === '\r' &&
        next === '\n'
      ) {
        index += 1;
      }

      row.push(value);

      if (
        row.some(cell =>
          String(cell).trim()
        )
      ) {
        rows.push(row);
      }

      row = [];
      value = '';
      continue;
    }

    value += char;
  }

  row.push(value);

  if (
    row.some(cell =>
      String(cell).trim()
    )
  ) {
    rows.push(row);
  }

  if (rows.length === 0) {
    return [];
  }

  const headers =
    rows[0].map(header =>
      String(header)
        .replace(/^\uFEFF/, '')
        .trim()
    );

  return rows
    .slice(1)
    .map(columns => {
      return headers.reduce(
        (record, header, index) => {
          record[header] =
            columns[index] ?? '';

          return record;
        },
        {}
      );
    });
};

const getMetadataValue = (
  row,
  candidates
) => {
  if (!row) {
    return '';
  }

  for (const key of candidates) {
    if (
      row[key] !== undefined &&
      row[key] !== null &&
      String(row[key]).trim()
    ) {
      return String(row[key]).trim();
    }
  }

  return '';
};

const cleanSubstackHtml = html => {
  const $ =
    cheerio.load(
      String(html || ''),
      null,
      false
    );

  $(
    [
      'script',
      'style',
      'noscript',
      'button',
      'label.hide-text',
      '.image-link-expand',
      '[data-component-name="SubscribeWidgetToDOM"]',
      '.subscription-widget-wrap',
      '.subscribe-widget',
      '.footer-wrap',
    ].join(',')
  ).remove();

  $('img').each((_, image) => {
    const element =
      $(image);

    const source =
      element.attr('src') ||
      element.attr('data-src');

    if (source) {
      element.attr(
        'src',
        source
      );
    }

    element.removeAttr('srcset');
    element.removeAttr('sizes');
    element.removeAttr('loading');
    element.removeAttr('fetchpriority');
    element.removeAttr('data-attrs');
    element.removeAttr('class');
  });

  $('a').each((_, anchor) => {
    const element =
      $(anchor);

    const href =
      element.attr('href') || '';

    if (
      href.includes(
        'internalRedirect='
      )
    ) {
      element.removeAttr('href');
    }

    element.removeAttr(
      'data-component-name'
    );
  });

  $('[class]').each((_, item) => {
    const element =
      $(item);

    const tagName =
      String(
        item.name || ''
      ).toLowerCase();

    if (
      tagName !== 'pre'
    ) {
      element.removeAttr(
        'class'
      );
    }
  });

  $('[data-component-name]')
    .removeAttr(
      'data-component-name'
    );

  return $.html();
};

const extractArticle = ({
  html,
  filename,
  metadata,
}) => {
  const cleanedHtml =
    cleanSubstackHtml(html);

  const $ =
    cheerio.load(
      cleanedHtml,
      null,
      false
    );

  const filenameWithoutExtension =
    String(filename || '')
      .replace(/\.html?$/i, '');

  const filenameWithoutId =
    filenameWithoutExtension
      .replace(/^\d+\./, '');

  const filenameTitle =
    filenameWithoutId
      .split('-')
      .filter(Boolean)
      .map(word =>
        word.charAt(0)
          .toUpperCase() +
        word.slice(1)
      )
      .join(' ');

  const title =
    getMetadataValue(
      metadata,
      [
        'title',
        'post_title',
        'draft_title',
      ]
    ) ||
    $('h1').first().text().trim() ||
    $('title').first().text().trim() ||
    filenameTitle ||
    'Artículo importado';

  const subtitle =
    getMetadataValue(
      metadata,
      [
        'subtitle',
        'post_subtitle',
        'draft_subtitle',
      ]
    );

  const sourcePostId =
    getMetadataValue(
      metadata,
      [
        'post_id',
        'id',
      ]
    ) ||
    (
      filenameWithoutExtension
        .match(/^(\d+)\./)?.[1] ||
      ''
    );

  const publishedAt =
    getMetadataValue(
      metadata,
      [
        'post_date',
        'published_at',
        'publication_date',
        'date',
      ]
    );

  const sourceUrl =
    getMetadataValue(
      metadata,
      [
        'canonical_url',
        'post_url',
        'url',
      ]
    );

  const excerpt =
    getMetadataValue(
      metadata,
      [
        'description',
        'excerpt',
      ]
    ) ||
    $('p')
      .first()
      .text()
      .trim()
      .slice(0, 300);

  const firstImage =
    $('img')
      .first()
      .attr('src') ||
    '';

  return {
    title,
    subtitle,
    excerpt,
    sourcePostId,
    sourceUrl,
    publishedAt,
    coverImageUrl:
      firstImage,
    contentHtml:
      cleanedHtml,
  };
};

const downloadImage = async url => {
  const response =
    await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 AgoraImporter/1.0',
      },

      redirect: 'follow',
    });

  if (!response.ok) {
    throw new Error(
      `No se pudo descargar la imagen: ${response.status}`
    );
  }

  const arrayBuffer =
    await response.arrayBuffer();

  const contentType =
    response.headers
      .get('content-type')
      ?.split(';')[0]
      ?.trim() ||
    'image/jpeg';

  const pathname =
    new URL(url).pathname;

  const filename =
    pathname
      .split('/')
      .pop() ||
    `substack-${Date.now()}`;

  return {
    buffer:
      Buffer.from(arrayBuffer),

    contentType,

    filename,
  };
};

const migrateImagesToR2 =
  async html => {
    const $ =
      cheerio.load(
        html,
        null,
        false
      );

    const images =
      $('img')
        .toArray();

    const cache =
      new Map();

    for (
      const image of images
    ) {
      const element =
        $(image);

      const source =
        element.attr('src');

      if (
        !source ||
        !/^https?:\/\//i.test(
          source
        )
      ) {
        continue;
      }

      try {
        let uploaded =
          cache.get(source);

        if (!uploaded) {
          const downloaded =
            await downloadImage(
              source
            );

          uploaded =
            await uploadBuffer({
              buffer:
                downloaded.buffer,

              filename:
                downloaded.filename,

              contentType:
                downloaded.contentType,

              folder:
                'articles/imported/substack',

              metadata: {
                source:
                  'substack',
              },
            });

          cache.set(
            source,
            uploaded
          );
        }

        element.attr(
          'src',
          uploaded.url
        );

        element.removeAttr(
          'srcset'
        );

        element.removeAttr(
          'sizes'
        );
      } catch (error) {
        console.error(
          'No se pudo migrar imagen:',
          source,
          error.message
        );
      }
    }

    return $.html();
  };

const findDuplicate =
  async article => {
    if (article.sourcePostId) {
      const {
        data,
        error,
      } = await supabase
        .from('articles')
        .select('id, title, slug')
        .eq(
          'source_platform',
          'substack'
        )
        .eq(
          'source_post_id',
          article.sourcePostId
        )
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (data) {
        return data;
      }
    }

    if (article.sourceUrl) {
      const {
        data,
        error,
      } = await supabase
        .from('articles')
        .select('id, title, slug')
        .eq(
          'source_url',
          article.sourceUrl
        )
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (data) {
        return data;
      }
    }

    return null;
  };

const createUniqueSlug =
  async title => {
    const base =
      slugify(title) ||
      'articulo-importado';

    let candidate =
      base;

    let suffix = 1;

    while (true) {
      const {
        data,
        error,
      } = await supabase
        .from('articles')
        .select('id')
        .eq('slug', candidate)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        return candidate;
      }

      suffix += 1;

      candidate =
        `${base}-${suffix}`;
    }
  };

const saveCategories =
  async (
    articleId,
    categoryIds
  ) => {
    if (
      !Array.isArray(
        categoryIds
      ) ||
      categoryIds.length === 0
    ) {
      return;
    }

    const rows =
      categoryIds.map(
        categoryId => ({
          article_id:
            articleId,

          category_id:
            categoryId,
        })
      );

    const { error } =
      await supabase
        .from(
          'article_categories'
        )
        .insert(rows);

    if (error) {
      throw error;
    }
  };

const importArticle =
  async ({
    article,
    options,
  }) => {
    const duplicate =
      await findDuplicate(
        article
      );

    const duplicateMode =
      options.duplicateMode ||
      'skip';

    if (
      duplicate &&
      duplicateMode === 'skip'
    ) {
      return {
        status: 'skipped',
        title: article.title,
        articleId:
          duplicate.id,
        reason:
          'duplicate',
      };
    }

    let contentHtml =
      article.contentHtml;

    if (
      options.downloadImages
    ) {
      contentHtml =
        await migrateImagesToR2(
          contentHtml
        );
    }

    const $ =
      cheerio.load(
        contentHtml,
        null,
        false
      );

    const coverImageUrl =
      $('img')
        .first()
        .attr('src') ||
      article.coverImageUrl ||
      null;

    const content =
      htmlToTiptap(
        contentHtml
      );

    const status =
      options.status ===
      'published'
        ? 'published'
        : 'draft';

    const publishedAt =
      status === 'published'
        ? (
            article.publishedAt ||
            new Date()
              .toISOString()
          )
        : null;

    const payload = {
      title:
        article.title,

      subtitle:
        article.subtitle ||
        null,

      excerpt:
        article.excerpt ||
        null,

      content,

      content_html:
        contentHtml,

      cover_image_url:
        coverImageUrl,

      collaborator_id:
        options.collaboratorId ||
        null,

      edition_id:
        options.editionId ||
        null,

      status,

      published_at:
        publishedAt,

      reading_time:
        readingTime(
          contentHtml
        ),

      source_platform:
        'substack',

      source_post_id:
        article.sourcePostId ||
        null,

      source_url:
        article.sourceUrl ||
        null,

      imported_at:
        new Date()
          .toISOString(),

      audio_status:
        'not_generated',
    };

    if (
      duplicate &&
      duplicateMode ===
        'update'
    ) {
      const {
        data,
        error,
      } = await supabase
        .from('articles')
        .update(payload)
        .eq(
          'id',
          duplicate.id
        )
        .select()
        .single();

      if (error) {
        throw error;
      }

      await supabase
        .from(
          'article_categories'
        )
        .delete()
        .eq(
          'article_id',
          duplicate.id
        );

      await saveCategories(
        duplicate.id,
        options.categoryIds
      );

      return {
        status: 'updated',
        title: data.title,
        articleId: data.id,
      };
    }

    payload.slug =
      await createUniqueSlug(
        article.title
      );

    const {
      data,
      error,
    } = await supabase
      .from('articles')
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw error;
    }

    await saveCategories(
      data.id,
      options.categoryIds
    );

    return {
      status: 'created',
      title: data.title,
      articleId: data.id,
    };
  };

const parseZipFiles = file => {
  const zip =
    new AdmZip(file.buffer);

  const entries =
    zip.getEntries();

  const csvEntry =
    entries.find(entry => {
      const name =
        entry.entryName
          .toLowerCase();

      return (
        !entry.isDirectory &&
        (
          name.endsWith(
            'posts.csv'
          ) ||
          name.endsWith(
            'post.csv'
          )
        )
      );
    });

  const metadataRows =
    csvEntry
      ? parseCsv(
          csvEntry
            .getData()
            .toString('utf8')
        )
      : [];

  const metadataById =
    new Map();

  metadataRows.forEach(row => {
    const id =
      getMetadataValue(
        row,
        [
          'post_id',
          'id',
        ]
      );

    if (id) {
      metadataById.set(
        String(id),
        row
      );
    }
  });

  return entries
    .filter(entry => {
      return (
        !entry.isDirectory &&
        /\.html?$/i.test(
          entry.entryName
        )
      );
    })
    .map(entry => {
      const filename =
        entry.entryName
          .split('/')
          .pop();

      const id =
        filename
          .match(/^(\d+)\./)?.[1];

      return {
        filename,

        html:
          entry
            .getData()
            .toString('utf8'),

        metadata:
          id
            ? metadataById.get(
                String(id)
              )
            : null,
      };
    });
};

const parseUploadedFiles =
  files => {
    const parsed = [];

    for (const file of files) {
      const filename =
        file.originalname ||
        'archivo';

      if (
        /\.zip$/i.test(
          filename
        )
      ) {
        parsed.push(
          ...parseZipFiles(
            file
          )
        );

        continue;
      }

      if (
        /\.html?$/i.test(
          filename
        )
      ) {
        parsed.push({
          filename,

          html:
            file.buffer
              .toString(
                'utf8'
              ),

          metadata: null,
        });
      }
    }

    return parsed;
  };

const importSubstack =
  async ({
    files,
    body,
  }) => {
    const categoryIds =
      normalizeArray(
        body.category_ids
      );

    const options = {
      collaboratorId:
        body.collaborator_id ||
        null,

      editionId:
        body.edition_id ||
        null,

      categoryIds,

      status:
        body.status ===
        'published'
          ? 'published'
          : 'draft',

      downloadImages:
        parseBoolean(
          body.download_images,
          true
        ),

      duplicateMode:
        [
          'skip',
          'update',
          'copy',
        ].includes(
          body.duplicate_mode
        )
          ? body.duplicate_mode
          : 'skip',
    };

    const parsedFiles =
      parseUploadedFiles(
        files
      );

    if (
      parsedFiles.length === 0
    ) {
      throw {
        status: 400,

        message:
          'No se encontraron publicaciones HTML dentro de los archivos.',
      };
    }

    const results = [];

    for (
      const file of parsedFiles
    ) {
      try {
        const article =
          extractArticle({
            html: file.html,
            filename:
              file.filename,
            metadata:
              file.metadata,
          });

        if (
          options.duplicateMode ===
          'copy'
        ) {
          article.sourcePostId =
            null;

          article.sourceUrl =
            null;
        }

        const result =
          await importArticle({
            article,
            options,
          });

        results.push(result);
      } catch (error) {
        console.error(
          'Error importando:',
          file.filename,
          error
        );

        results.push({
          status: 'error',

          title:
            file.filename,

          message:
            error.message ||
            'Error desconocido',
        });
      }
    }

    return {
      total:
        results.length,

      created:
        results.filter(
          item =>
            item.status ===
            'created'
        ).length,

      updated:
        results.filter(
          item =>
            item.status ===
            'updated'
        ).length,

      skipped:
        results.filter(
          item =>
            item.status ===
            'skipped'
        ).length,

      errors:
        results.filter(
          item =>
            item.status ===
            'error'
        ).length,

      results,
    };
  };

const buildStandaloneHtml =
  article => {
    const authorName =
      article.collaborators
        ?.name ||
      'Agorá Revista';

    const publishedDate =
      article.published_at
        ? new Date(
            article.published_at
          ).toISOString()
        : '';

    return [
      '<!doctype html>',
      '<html lang="es">',
      '<head>',
      '<meta charset="utf-8">',
      '<meta name="viewport" content="width=device-width, initial-scale=1">',
      `<title>${escapeXml(article.title)}</title>`,
      article.subtitle
        ? `<meta name="description" content="${escapeXml(article.subtitle)}">`
        : '',
      '</head>',
      '<body>',
      '<article>',
      `<header><h1>${escapeXml(article.title)}</h1>`,
      article.subtitle
        ? `<p><em>${escapeXml(article.subtitle)}</em></p>`
        : '',
      `<p>Por ${escapeXml(authorName)}</p>`,
      publishedDate
        ? `<time datetime="${escapeXml(publishedDate)}">${escapeXml(publishedDate)}</time>`
        : '',
      '</header>',
      article.cover_image_url
        ? `<figure><img src="${escapeXml(article.cover_image_url)}" alt="${escapeXml(article.title)}"></figure>`
        : '',
      article.content_html ||
        '',
      '</article>',
      '</body>',
      '</html>',
    ].join('\n');
  };

const exportArticleHtml =
  async articleId => {
    const {
      data,
      error,
    } = await supabase
      .from('articles')
      .select(`
        *,
        collaborators (
          id,
          name,
          slug
        ),
        article_categories (
          categories (
            id,
            name,
            slug
          )
        ),
        article_tags (
          tag,
          tag_type
        )
      `)
      .eq('id', articleId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      throw {
        status: 404,
        message:
          'Artículo no encontrado',
      };
    }

    return {
      filename:
        `${data.slug || 'articulo'}.html`,

      content:
        buildStandaloneHtml(
          data
        ),
    };
  };

const exportWordPress =
  async () => {
    const {
      data: articles,
      error,
    } = await supabase
      .from('articles')
      .select(`
        *,
        collaborators (
          id,
          name,
          slug
        ),
        article_categories (
          categories (
            id,
            name,
            slug
          )
        ),
        article_tags (
          tag,
          tag_type
        )
      `)
      .neq(
        'status',
        'archived'
      )
      .order(
        'published_at',
        {
          ascending: true,
          nullsFirst: true,
        }
      );

    if (error) {
      throw error;
    }

    const items =
      (articles || [])
        .map(article => {
          const categories =
            article
              .article_categories
              ?.map(
                item =>
                  item.categories
              )
              .filter(Boolean) ||
            [];

          const tags =
            article
              .article_tags ||
            [];

          const postDate =
            article.published_at ||
            article.created_at ||
            new Date()
              .toISOString();

          const wpStatus =
            article.status ===
            'published'
              ? 'publish'
              : 'draft';

          const author =
            article.collaborators
              ?.name ||
            'Agorá Revista';

          const categoryXml =
            categories
              .map(category => {
                return [
                  '<category',
                  ` domain="category"`,
                  ` nicename="${escapeXml(category.slug)}">`,
                  `<![CDATA[${escapeCdata(category.name)}]]>`,
                  '</category>',
                ].join('');
              })
              .join('\n');

          const tagXml =
            tags
              .map(tag => {
                const tagSlug =
                  slugify(
                    tag.tag
                  );

                return [
                  '<category',
                  ` domain="post_tag"`,
                  ` nicename="${escapeXml(tagSlug)}">`,
                  `<![CDATA[${escapeCdata(tag.tag)}]]>`,
                  '</category>',
                ].join('');
              })
              .join('\n');

          return `
<item>
  <title><![CDATA[${escapeCdata(article.title)}]]></title>
  <link>https://agorarevista.com/articulos/${escapeXml(article.slug)}</link>
  <pubDate>${new Date(postDate).toUTCString()}</pubDate>
  <dc:creator><![CDATA[${escapeCdata(author)}]]></dc:creator>
  <guid isPermaLink="false">agora-${escapeXml(article.id)}</guid>
  <description><![CDATA[${escapeCdata(article.excerpt || article.subtitle || '')}]]></description>
  <content:encoded><![CDATA[${escapeCdata(article.content_html || '')}]]></content:encoded>
  <excerpt:encoded><![CDATA[${escapeCdata(article.excerpt || '')}]]></excerpt:encoded>
  <wp:post_id>${escapeXml(article.id)}</wp:post_id>
  <wp:post_date><![CDATA[${escapeCdata(postDate)}]]></wp:post_date>
  <wp:post_date_gmt><![CDATA[${escapeCdata(postDate)}]]></wp:post_date_gmt>
  <wp:comment_status>closed</wp:comment_status>
  <wp:ping_status>closed</wp:ping_status>
  <wp:post_name><![CDATA[${escapeCdata(article.slug)}]]></wp:post_name>
  <wp:status><![CDATA[${wpStatus}]]></wp:status>
  <wp:post_parent>0</wp:post_parent>
  <wp:menu_order>0</wp:menu_order>
  <wp:post_type>post</wp:post_type>
  <wp:post_password></wp:post_password>
  <wp:is_sticky>${article.is_featured ? 1 : 0}</wp:is_sticky>
  ${categoryXml}
  ${tagXml}
</item>`;
        })
        .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss
  version="2.0"
  xmlns:excerpt="http://wordpress.org/export/1.2/excerpt/"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:wfw="http://wellformedweb.org/CommentAPI/"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:wp="http://wordpress.org/export/1.2/"
>
<channel>
  <title>Agorá Revista</title>
  <link>https://agorarevista.com</link>
  <description>Exportación de artículos de Agorá Revista</description>
  <pubDate>${new Date().toUTCString()}</pubDate>
  <language>es-MX</language>
  <wp:wxr_version>1.2</wp:wxr_version>
  <wp:base_site_url>https://agorarevista.com</wp:base_site_url>
  <wp:base_blog_url>https://agorarevista.com</wp:base_blog_url>
  ${items}
</channel>
</rss>`;

    return {
      filename:
        `agora-substack-${Date.now()}.xml`,

      content: xml,
    };
  };

module.exports = {
  importSubstack,
  exportArticleHtml,
  exportWordPress,
};