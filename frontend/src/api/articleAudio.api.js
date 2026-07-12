import api from './axios';

export const generateArticleVoice = (
  articleId,
  voice
) =>
  api
    .post(
      `/article-audio/${articleId}/generate`,
      { voice },
      {
        timeout: 5 * 60 * 1000,
      }
    )
    .then(response => response.data);

export const generateBothArticleVoices = (
  articleId
) =>
  api
    .post(
      `/article-audio/${articleId}/generate-both`,
      {},
      {
        timeout: 10 * 60 * 1000,
      }
    )
    .then(response => response.data);

export const deleteArticleVoice = (
  articleId,
  voice
) =>
  api
    .delete(
      `/article-audio/${articleId}/${voice}`
    )
    .then(response => response.data);