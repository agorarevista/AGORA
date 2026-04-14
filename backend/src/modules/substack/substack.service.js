const publishToSubstack = async (article) => {
  try {
    const axios = require('axios');
    const substackDomain = process.env.SUBSTACK_URL;
    const cookie = process.env.SUBSTACK_COOKIE;

    if (!cookie || !substackDomain) return null;

    const draftRes = await axios.post(
      `${substackDomain}/api/v1/posts`,
      {
        draft_title: article.title,
        draft_subtitle: article.subtitle || '',
        draft_body: article.content_html,
        type: 'newsletter'
      },
      {
        headers: {
          'Cookie': cookie,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    const postId = draftRes.data.id;

    await axios.post(
      `${substackDomain}/api/v1/posts/${postId}/publish`,
      { send_email: false },
      { headers: { 'Cookie': cookie }, timeout: 10000 }
    );

    return `${substackDomain}/p/${draftRes.data.slug}`;
  } catch (error) {
    console.error('Substack crosspost falló (no crítico):', error.message);
    return null;
  }
};

module.exports = { publishToSubstack };