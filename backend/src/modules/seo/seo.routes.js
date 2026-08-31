const express =
  require('express');

const {
  createSeoController,
} = require('./seo.controller');


const createSeoRouter =
  frontendIndexPath => {
    const router =
      express.Router();

    const {
      renderArticle,
      renderGallery,
      renderCategory,
      renderCollaborator,
      renderEdition,
      renderStaticPage,
    } =
      createSeoController(
        frontendIndexPath
      );


    /*
     * ══════════════════════════════════════════════════
     * PÁGINAS DINÁMICAS
     * ══════════════════════════════════════════════════
     */

    router.get(
      '/articulos/:slug',
      renderArticle
    );

    router.get(
      '/galeria/:slug',
      renderGallery
    );

    router.get(
      '/categoria/:slug',
      renderCategory
    );

    router.get(
      '/colaborador/:slug',
      renderCollaborator
    );

    router.get(
      '/edicion/:number',
      renderEdition
    );


    /*
     * ══════════════════════════════════════════════════
     * PÁGINAS PÚBLICAS ESTÁTICAS
     * ══════════════════════════════════════════════════
     */

    router.get(
      '/ediciones',
      renderStaticPage
    );

    router.get(
      '/archivo',
      renderStaticPage
    );

    router.get(
      '/columnas',
      renderStaticPage
    );

    router.get(
      '/convocatorias',
      renderStaticPage
    );

    router.get(
      '/colaboradores',
      renderStaticPage
    );

    router.get(
      '/quienes-somos',
      renderStaticPage
    );

    router.get(
      '/ediciones-especiales',
      renderStaticPage
    );

    router.get(
      '/galeria',
      renderStaticPage
    );


    return router;
  };


module.exports =
  createSeoRouter;