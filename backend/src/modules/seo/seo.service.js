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

const getCategorySeoBySlug =
  async slug => {
    const {
      data,
      error,
    } = await supabase
      .from('categories')
      .select(`
        id,
        name,
        slug,
        description,
        cover_image_url,
        is_active
      `)
      .eq(
        'slug',
        slug
      )
      .eq(
        'is_active',
        true
      )
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data || null;
  };

const getCollaboratorSeoBySlug =
  async slug => {
    const {
      data,
      error,
    } = await supabase
      .from('collaborators')
      .select(`
        id,
        name,
        slug,
        bio,
        photo_url,
        section_name,
        section_description,
        is_active
      `)
      .eq(
        'slug',
        slug
      )
      .eq(
        'is_active',
        true
      )
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data || null;
  };

const getEditionSeoByNumber =
  async number => {
    const {
      data,
      error,
    } = await supabase
      .from('editions')
      .select(`
        id,
        number,
        name,
        description,
        cover_image_url,
        published_at,
        is_special
      `)
      .eq(
        'number',
        number
      )
      .eq(
        'is_special',
        false
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
  getCategorySeoBySlug,
  getCollaboratorSeoBySlug,
  getEditionSeoByNumber,
};