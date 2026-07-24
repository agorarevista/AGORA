const fs =
  require('fs');

const path =
  require('path');

const sharp =
  require('sharp');

const CARD_WIDTH =
  1200;

const CARD_HEIGHT =
  630;

const BRAND_ICON_SIZE =
  86;

const BRAND_ICON_MARGIN =
  30;

const BRAND_ICON_OPACITY =
  0.68;

/*
 * Carpeta generada por Vite.
 *
 * Buscamos automáticamente cualquier
 * archivo cuyo nombre sea ICON-*.png.
 */
const frontendAssetsPath =
  path.resolve(
    __dirname,
    '../../../../frontend/dist/assets'
  );

/*
 * Busca el ícono de Agorá dentro
 * de los assets generados por Vite.
 */
const findAgoraBrandIconPath =
  () => {
    if (
      !fs.existsSync(
        frontendAssetsPath
      )
    ) {
      console.warn(
        `No existe la carpeta de assets: ${frontendAssetsPath}`
      );

      return null;
    }

    const files =
      fs.readdirSync(
        frontendAssetsPath
      );

    const iconFile =
      files.find(
        filename =>
          /^ICON-.*\.png$/i.test(
            filename
          )
      );

    if (!iconFile) {
      console.warn(
        'No se encontró un archivo ICON-*.png para la marca de agua.'
      );

      return null;
    }

    return path.join(
      frontendAssetsPath,
      iconFile
    );
  };

/*
 * Descarga la portada original desde Imgur
 * o desde cualquier URL HTTPS válida.
 */
const fetchImageBuffer =
  async imageUrl => {
    if (!imageUrl) {
      return null;
    }

    const controller =
      new AbortController();

    const timeout =
      setTimeout(
        () => {
          controller.abort();
        },
        12000
      );

    try {
      const response =
        await fetch(
          imageUrl,
          {
            signal:
              controller.signal,

            headers: {
              'User-Agent':
                'Agora-OG-Image/1.0',

              Accept:
                'image/avif,image/webp,image/png,image/jpeg,*/*',
            },
          }
        );

      if (!response.ok) {
        throw new Error(
          `La imagen respondió con ${response.status}`
        );
      }

      const arrayBuffer =
        await response.arrayBuffer();

      return Buffer.from(
        arrayBuffer
      );
    } catch (error) {
      console.warn(
        'No se pudo descargar la portada para Open Graph:',
        error.message
      );

      return null;
    } finally {
      clearTimeout(
        timeout
      );
    }
  };

/*
 * Prepara el ícono de Agorá como una
 * marca de agua semitransparente.
 */
const createBrandWatermark =
  async brandIconPath => {
    if (!brandIconPath) {
      return null;
    }

    try {
      const resizedIcon =
        await sharp(
          brandIconPath
        )
          .resize({
            width:
              BRAND_ICON_SIZE,

            height:
              BRAND_ICON_SIZE,

            fit:
              'contain',

            position:
              'centre',

            withoutEnlargement:
              true,

            background: {
              r: 0,
              g: 0,
              b: 0,
              alpha: 0,
            },
          })
          .ensureAlpha()
          .png()
          .toBuffer();

      /*
       * Aplicamos la opacidad al ícono
       * conservando el fondo transparente.
       */
      return sharp(
        resizedIcon
      )
        .ensureAlpha()
        .linear(
          [
            1,
            1,
            1,
            BRAND_ICON_OPACITY,
          ],
          [
            0,
            0,
            0,
            0,
          ]
        )
        .png()
        .toBuffer();
    } catch (error) {
      console.warn(
        'No se pudo procesar la marca de agua de Agorá:',
        error.message
      );

      return null;
    }
  };

/*
 * Genera la imagen Open Graph final:
 *
 * - JPEG
 * - 1200 × 630
 * - sRGB
 * - portada a pantalla completa
 * - logo arriba a la derecha
 * - sin transparencia final
 */
const createOgImage =
  async content => {
    const sourceImage =
      content.cover_image_url ||
      content.social_image_url ||
      null;

    const sourceBuffer =
      await fetchImageBuffer(
        sourceImage
      );

    /*
     * Usamos PNG como formato intermedio
     * para poder componer la marca de agua.
     */
    let baseImage;

    if (sourceBuffer) {
      try {
        baseImage =
          await sharp(
            sourceBuffer
          )
            .rotate()
            .resize({
              width:
                CARD_WIDTH,

              height:
                CARD_HEIGHT,

              fit:
                'cover',

              position:
                sharp.strategy.attention,
            })
            .flatten({
              background:
                '#ffffff',
            })
            .toColourspace(
              'srgb'
            )
            .png()
            .toBuffer();
      } catch (error) {
        console.warn(
          'No se pudo procesar la portada Open Graph:',
          error.message
        );
      }
    }

    /*
     * Fondo de respaldo cuando el artículo
     * no tiene una portada válida.
     */
    if (!baseImage) {
      baseImage =
        await sharp({
          create: {
            width:
              CARD_WIDTH,

            height:
              CARD_HEIGHT,

            channels: 3,

            background:
              '#181217',
          },
        })
          .toColourspace(
            'srgb'
          )
          .png()
          .toBuffer();
    }

    const composites = [];

    const brandIconPath =
      findAgoraBrandIconPath();

    const brandWatermark =
      await createBrandWatermark(
        brandIconPath
      );

    if (brandWatermark) {
      composites.push({
        input:
          brandWatermark,

        left:
          CARD_WIDTH -
          BRAND_ICON_SIZE -
          BRAND_ICON_MARGIN,

        top:
          BRAND_ICON_MARGIN,
      });
    }

    /*
     * El resultado final siempre se entrega
     * como JPEG real.
     */
    return sharp(
      baseImage
    )
      .composite(
        composites
      )
      .flatten({
        background:
          '#ffffff',
      })
      .toColourspace(
        'srgb'
      )
      .jpeg({
        quality:
          88,

        progressive:
          true,

        chromaSubsampling:
          '4:4:4',

        mozjpeg:
          true,
      })
      .toBuffer();
  };

module.exports = {
  createOgImage,
};