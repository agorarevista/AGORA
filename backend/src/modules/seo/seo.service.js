const supabase =
  require('../../config/supabase');


const getArticleSeoBySlug =
  async slug => {
    const {
      data,
      error,
    } = await supabase
      .from('articles')
      .select(`
        id,
        title,
        slug,
        subtitle,
        excerpt,
        content_html,
        cover_image_url,
        seo_title,
        seo_description,
        social_title,
        social_description,
        social_image_url,
        published_at,
        status,

        collaborators (
          id,
          name,
          slug
        )
      `)
      .eq(
        'slug',
        slug
      )
      .eq(
        'status',
        'published'
      )
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data || null;
  };

const getGallerySeoBySlug =
  async slug => {
    const {
      data,
      error,
    } = await supabase
      .from('galleries')
      .select(`
        id,
        title,
        slug,
        subtitle,
        excerpt,
        cover_image_url,
        seo_title,
        seo_description,
        social_title,
        social_description,
        social_image_url,
        published_at,
        status,

        collaborators (
          id,
          name,
          slug
        )
      `)
      .eq(
        'slug',
        slug
      )
      .eq(
        'status',
        'published'
      )
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data || null;
  };

module.exports = {
  getArticleSeoBySlug,
  getGallerySeoBySlug,
};