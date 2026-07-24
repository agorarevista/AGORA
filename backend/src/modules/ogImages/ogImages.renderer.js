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

/*
 * Carpeta generada por Vite.
 *
 * Aquí buscamos automáticamente:
 *
 * ICON-Bs6ewnDk.png
 *
 * El hash puede cambiar en futuros builds,
 * por eso no escribimos el nombre completo.
 */
const frontendAssetsPath =
  path.resolve(
    __dirname,
    '../../../../frontend/dist/assets'
  );

/*
 * Busca el ícono principal de Agorá.
 *
 * Ejemplo actual:
 *
 * ICON-Bs6ewnDk.png
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
        'No se encontró un archivo ICON-*.png para la marca Open Graph.'
      );

      return null;
    }

    return path.join(
      frontendAssetsPath,
      iconFile
    );
  };

/*
 * Descarga la portada desde Imgur
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
 * Genera la imagen Open Graph final.
 *
 * Resultado:
 *
 * - 1200 × 630
 * - portada ocupando toda la tarjeta
 * - ícono pequeño de Agorá arriba a la derecha
 */
const createOgImage =
  async content => {
    /*
     * Usamos principalmente la portada real.
     *
     * social_image_url queda como respaldo
     * por si algún contenido antiguo no tiene
     * cover_image_url.
     */
    const sourceImage =
      content.cover_image_url ||
      content.social_image_url ||
      null;

    const sourceBuffer =
      await fetchImageBuffer(
        sourceImage
      );

    /*
     * Fondo de respaldo cuando no existe
     * una portada válida.
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
            .png()
            .toBuffer();
      } catch (error) {
        console.warn(
          'No se pudo procesar la portada Open Graph:',
          error.message
        );
      }
    }

    if (!baseImage) {
      baseImage =
        await sharp({
          create: {
            width:
              CARD_WIDTH,

            height:
              CARD_HEIGHT,

            channels: 4,

            background:
              '#181217',
          },
        })
          .png()
          .toBuffer();
    }

    const composites = [];

    const brandIconPath =
      findAgoraBrandIconPath();

    if (brandIconPath) {
      try {
        /*
         * Marca de agua sin contenedor.
         *
         * Reducimos ligeramente la opacidad
         * del propio ícono para que se integre
         * con la fotografía.
         */
        const iconSize =
          86;

        const iconOpacity =
          0.68;

        const iconBuffer =
          await sharp(
            brandIconPath
          )
            .resize({
              width:
                iconSize,

              height:
                iconSize,

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
            .linear(
              [
                1,
                1,
                1,
                iconOpacity,
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

        composites.push({
          input:
            iconBuffer,

          left:
            CARD_WIDTH -
            iconSize -
            30,

          top:
            30,
        });
      } catch (error) {
        console.warn(
          'No se pudo procesar el ícono de marca de Agorá:',
          error.message
        );
      }
    }

    return sharp(
      baseImage
    )
      .composite(
        composites
      )
      .png({
        quality: 92,
        compressionLevel: 8,
      })
      .toBuffer();
  };

module.exports = {
  createOgImage,
};