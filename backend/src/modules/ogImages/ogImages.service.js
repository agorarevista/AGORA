const supabase =
  require('../../config/supabase');

const ARTICLE_SELECT = `
  id,
  title,
  slug,
  subtitle,
  excerpt,
  content_html,
  cover_image_url,
  social_image_url,
  seo_title,
  seo_description,
  social_title,
  social_description,

  collaborators (
    id,
    name,
    photo_url
  ),

  article_categories (
    categories (
      id,
      name,
      slug
    )
  )
`;

const GALLERY_SELECT = `
  id,
  title,
  slug,
  subtitle,
  excerpt,
  cover_image_url,
  social_image_url,
  seo_title,
  seo_description,
  social_title,
  social_description,

  collaborators (
    id,
    name,
    photo_url
  )
`;

const getArticleOgData =
  async slug => {
    const {
      data,
      error,
    } = await supabase
      .from('articles')
      .select(
        ARTICLE_SELECT
      )
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

const getGalleryOgData =
  async slug => {
    const {
      data,
      error,
    } = await supabase
      .from('galleries')
      .select(
        GALLERY_SELECT
      )
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
  getArticleOgData,
  getGalleryOgData,
};