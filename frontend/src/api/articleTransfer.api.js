import api from './axios';

const downloadBlob = (
  blob,
  fallbackName
) => {
  const url =
    window.URL.createObjectURL(
      blob
    );

  const anchor =
    document.createElement('a');

  anchor.href = url;

  anchor.download =
    fallbackName;

  document.body.appendChild(
    anchor
  );

  anchor.click();
  anchor.remove();

  window.URL.revokeObjectURL(
    url
  );
};

export const importSubstackArticles =
  ({
    files,
    collaboratorId,
    categoryIds,
    status,
    downloadImages,
    duplicateMode,
  }) => {
    const formData =
      new FormData();

    Array.from(files || [])
      .forEach(file => {
        formData.append(
          'files',
          file
        );
      });

    formData.append(
      'collaborator_id',
      collaboratorId || ''
    );

    formData.append(
      'category_ids',
      JSON.stringify(
        categoryIds || []
      )
    );

    formData.append(
      'status',
      status || 'draft'
    );

    formData.append(
      'download_images',
      String(
        Boolean(
          downloadImages
        )
      )
    );

    formData.append(
      'duplicate_mode',
      duplicateMode ||
      'skip'
    );

    return api
      .post(
        '/article-transfer/substack/import',
        formData,
        {
          timeout: 0,

          headers: {
            'Content-Type':
              'multipart/form-data',
          },
        }
      )
      .then(response =>
        response.data
      );
  };

export const exportArticleHtml =
  async article => {
    const response =
      await api.get(
        `/article-transfer/export/${article.id}/html`,
        {
          responseType:
            'blob',

          timeout: 0,
        }
      );

    downloadBlob(
      response.data,
      `${article.slug || 'articulo'}.html`
    );
  };

export const exportAllToSubstack =
  async () => {
    const response =
      await api.get(
        '/article-transfer/export/wordpress',
        {
          responseType:
            'blob',

          timeout: 0,
        }
      );

    downloadBlob(
      response.data,
      'agora-substack-export.xml'
    );
  };