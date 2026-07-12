import {
  forwardRef,
  Suspense,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  Canvas,
  useFrame,
  useThree,
} from '@react-three/fiber';

import {
  PointerLockControls,
  Text,
  useTexture,
} from '@react-three/drei';

import {
  Color,
  Euler,
  MathUtils,
  Vector3,
} from 'three';

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Info,
  MousePointer2,
} from 'lucide-react';

import styles from './GalleryMuseum.module.css';

const hashSeed = value => {
  const source =
    String(value || 'agora');

  let hash =
    2166136261;

  for (
    let index = 0;
    index <
    source.length;
    index += 1
  ) {
    hash ^=
      source.charCodeAt(
        index
      );

    hash +=
      (hash << 1) +
      (hash << 4) +
      (hash << 7) +
      (hash << 8) +
      (hash << 24);
  }

  return (
    hash >>> 0
  );
};

const createRandom = seed => {
  let state =
    hashSeed(seed);

  return () => {
    state +=
      0x6d2b79f5;

    let value =
      state;

    value =
      Math.imul(
        value ^
        (value >>> 15),
        value | 1
      );

    value ^=
      value +
      Math.imul(
        value ^
        (value >>> 7),
        value | 61
      );

    return (
      (
        value ^
        (value >>> 14)
      ) >>>
      0
    ) /
    4294967296;
  };
};

const generateMuseumLayout = (
  photos,
  seed
) => {
  const random =
    createRandom(seed);

  const roomLength =
    10;

  const roomWidth =
    9.4;

  const photosPerRoom =
    6;

  const roomCount =
    Math.max(
      1,
      Math.ceil(
        photos.length /
        photosPerRoom
      )
    );

  const rooms =
    Array.from({
      length:
        roomCount,
    }).map(
      (_, roomIndex) => {
        return {
          id:
            `room-${roomIndex}`,

          index:
            roomIndex,

          centerZ:
            -roomIndex *
            roomLength,

          width:
            roomWidth +
            random() *
            0.8,

          length:
            roomLength,

          openingSide:
            roomIndex %
              2 ===
            0
              ? 'right'
              : 'left',

          accent:
            random() >
            0.5
              ? '#a4518d'
              : '#c9a84c',
        };
      }
    );

  const artworks = [];

  rooms.forEach(
    room => {
      const roomPhotos =
        photos.slice(
          room.index *
            photosPerRoom,

          room.index *
            photosPerRoom +
            photosPerRoom
        );

      const leftPhotos =
        roomPhotos.filter(
          (
            _photo,
            index
          ) =>
            index % 2 ===
            0
        );

      const rightPhotos =
        roomPhotos.filter(
          (
            _photo,
            index
          ) =>
            index % 2 !==
            0
        );

      const createSideArtwork =
        (
          photo,
          side,
          sideIndex,
          sideTotal
        ) => {
          const ratio =
            photo.width &&
            photo.height
              ? Number(
                  photo.width
                ) /
                Number(
                  photo.height
                )
              : 4 / 3;

          const height =
            ratio < 0.8
              ? 2.05
              : ratio > 1.65
                ? 1.45
                : 1.78;

          const width =
            MathUtils.clamp(
              height *
              ratio,
              1.15,
              2.65
            );

          const usableLength =
            room.length -
            3;

          const gap =
            usableLength /
            Math.max(
              sideTotal,
              1
            );

          const positionZ =
            room.centerZ +
            room.length /
              2 -
            1.5 -
            gap *
              (
                sideIndex +
                0.5
              );

          return {
            id:
              photo.id ||
              `${room.id}-${side}-${sideIndex}`,

            photo,

            position: [
              side ===
              'left'
                ? -(
                    room.width /
                      2 -
                    0.09
                  )
                : room.width /
                    2 -
                  0.09,

              2.08,

              positionZ,
            ],

            rotation: [
              0,

              side ===
              'left'
                ? Math.PI /
                  2
                : -Math.PI /
                  2,

              0,
            ],

            width,
            height,
          };
        };

      leftPhotos.forEach(
        (
          photo,
          index
        ) => {
          artworks.push(
            createSideArtwork(
              photo,
              'left',
              index,
              leftPhotos.length
            )
          );
        }
      );

      rightPhotos.forEach(
        (
          photo,
          index
        ) => {
          artworks.push(
            createSideArtwork(
              photo,
              'right',
              index,
              rightPhotos.length
            )
          );
        }
      );
    }
  );

  const totalDepth =
    roomCount *
      roomLength +
    4;

  return {
    rooms,
    artworks,
    totalDepth,

    bounds: {
      minX:
        -roomWidth /
          2 +
        0.7,

      maxX:
        roomWidth /
          2 -
        0.7,

      minZ:
        -totalDepth +
        4,

      maxZ:
        4.8,
    },
  };
};

const GalleryMuseum =
  forwardRef(function GalleryMuseum(
    {
      photos,
      seed,
      author,
      onPhotoClick,
      onAuthorClick,
      paused = false,
    },
    ref
  ) {
    const controlsRef =
      useRef(null);

    const pendingPhotoRef =
      useRef(null);

    const pendingAuthorRef =
      useRef(null);

    /*
     * Evita que varios clics consecutivos intenten
     * abrir la misma fotografía o el perfil del autor
     * mientras se libera el Pointer Lock.
     */
    const artworkOpeningRef =
      useRef(false);

    /*
     * Momento hasta el cual ignoraremos el clic residual
     * producido al regresar automáticamente del preview.
     */
    const artworkClickBlockedUntilRef =
      useRef(0);

    const [
      pointerLocked,
      setPointerLocked,
    ] = useState(false); 

  const [
    mobileMovement,
    setMobileMovement,
  ] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false,
  });

  const layout =
    useMemo(
      () =>
        generateMuseumLayout(
          Array.isArray(photos)
            ? photos
            : [],
          seed
        ),
      [
        photos,
        seed,
      ]
    );

  useImperativeHandle(
    ref,
    () => ({
      resumeFromPreview() {
        document.body.style.cursor =
          '';

        /*
         * Solo bloqueamos durante 220 ms el clic residual
         * que cerró el preview. No dejamos un booleano
         * permanentemente activo.
         */
        artworkClickBlockedUntilRef.current =
          performance.now() +
          220;

        if (
          !document.pointerLockElement
        ) {
          controlsRef.current
            ?.lock?.();
        }
      },
    }),
    []
  );

  useEffect(() => {
    const handlePointerLockChange =
      () => {
        const isLocked =
          Boolean(
            document.pointerLockElement
          );

        setPointerLocked(
          isLocked
        );

        if (isLocked) {
          return;
        }

        const photoToOpen =
          pendingPhotoRef.current;

        const authorToOpen =
          pendingAuthorRef.current;

        pendingPhotoRef.current =
          null;

        pendingAuthorRef.current =
          null;

        document.body.style.cursor =
          '';

        if (photoToOpen) {
          window.requestAnimationFrame(
            () => {
              onPhotoClick?.(
                photoToOpen
              );

              artworkOpeningRef.current =
                false;
            }
          );

          return;
        }

        if (authorToOpen) {
          window.requestAnimationFrame(
            () => {
              onAuthorClick?.(
                authorToOpen
              );

              artworkOpeningRef.current =
                false;
            }
          );
        }
      };

    document.addEventListener(
      'pointerlockchange',
      handlePointerLockChange
    );

    return () => {
      document.removeEventListener(
        'pointerlockchange',
        handlePointerLockChange
      );
    };
  }, [
    onPhotoClick,
    onAuthorClick,
  ]);

  useEffect(() => {
    if (!paused) {
      return;
    }

    /*
     * El preview ya está abierto; limpiamos cualquier
     * apertura pendiente para evitar duplicados.
     */
    pendingPhotoRef.current =
      null;

    pendingAuthorRef.current =
      null;

    artworkOpeningRef.current =
      false;

    if (
      document.pointerLockElement
    ) {
      controlsRef.current
        ?.unlock?.();
    }

    setPointerLocked(
      false
    );

    document.body.style.cursor =
      '';
  }, [paused]);

  const handleArtworkClick =
    photo => {
      if (
        !photo ||
        paused ||
        artworkOpeningRef.current
      ) {
        return;
      }

      artworkOpeningRef.current =
        true;

      pendingPhotoRef.current =
        photo;

      pendingAuthorRef.current =
        null;

      document.body.style.cursor =
        '';

      if (
        document.pointerLockElement
      ) {
        window.requestAnimationFrame(
          () => {
            controlsRef.current
              ?.unlock?.();
          }
        );

        return;
      }

      const photoToOpen =
        pendingPhotoRef.current;

      pendingPhotoRef.current =
        null;

      onPhotoClick?.(
        photoToOpen
      );

      artworkOpeningRef.current =
        false;
    };

  const handleAuthorPortraitClick =
    selectedAuthor => {
      if (
        !selectedAuthor ||
        paused ||
        artworkOpeningRef.current
      ) {
        return;
      }

      artworkOpeningRef.current =
        true;

      pendingAuthorRef.current =
        selectedAuthor;

      pendingPhotoRef.current =
        null;

      document.body.style.cursor =
        '';

      if (
        document.pointerLockElement
      ) {
        window.requestAnimationFrame(
          () => {
            controlsRef.current
              ?.unlock?.();
          }
        );

        return;
      }

      const authorToOpen =
        pendingAuthorRef.current;

      pendingAuthorRef.current =
        null;

      onAuthorClick?.(
        authorToOpen
      );

      artworkOpeningRef.current =
        false;
    };

  return (
    <div
      className={
        styles.wrapper
      }
    >
      <Canvas
        className={
          styles.canvas
        }
        style={{
          pointerEvents:
            paused
              ? 'none'
              : 'auto',
        }}
        camera={{
          position: [
            0,
            1.72,
            4.2,
          ],

          fov: 68,

          near: 0.1,

          far:
            Math.max(
              160,
              layout.totalDepth +
              30
            ),
        }}
        dpr={[
          1,
          1.6,
        ]}
        shadows
        gl={{
          antialias: true,
          powerPreference:
            'high-performance',
        }}
      >
        <color
          attach="background"
          args={[
            '#11100f',
          ]}
        />

        <fog
          attach="fog"
          args={[
            '#11100f',
            18,
            Math.max(
              45,
              layout.totalDepth +
              18
            ),
          ]}
        />

        <ambientLight
          intensity={0.55}
        />

        <directionalLight
          position={[
            4,
            9,
            4,
          ]}
          intensity={1.15}
          castShadow
        />

        <Suspense
          fallback={null}
        >
          <MuseumArchitecture
            layout={
              layout
            }
          />

          <MuseumArtworks
            artworks={
              layout.artworks
            }
            galleryAuthor={
              author
            }
            onPhotoClick={
              handleArtworkClick
            }
            artworkClickBlockedUntilRef={
              artworkClickBlockedUntilRef
            }
          />

          {author && (
            <MuseumAuthorPortrait
              author={
                author
              }
              layout={
                layout
              }
              onAuthorClick={
                handleAuthorPortraitClick
              }
              artworkClickBlockedUntilRef={
                artworkClickBlockedUntilRef
              }
            />
          )}
        </Suspense>

<FirstPersonMovement
  mobileMovement={
    mobileMovement
  }
  bounds={
    layout.bounds
  }
  paused={
    paused
  }
/>
<PointerLockControls
  ref={
    controlsRef
  }
  onLock={() => {
    setPointerLocked(
      true
    );
  }}
  onUnlock={() => {
    setPointerLocked(
      false
    );
  }}
/>
      </Canvas>

      {!paused &&
        pointerLocked && (
        <div
          className={
            styles.reticle
          }
          aria-hidden="true"
        >
          <span />
        </div>
      )}

      {!paused && (
        <div
          className={
            styles.instructions
          }
        >
        <Info
          size={15}
        />

        <span>
          {pointerLocked
            ? 'WASD para caminar · Mouse para mirar · ESC para liberar'
            : 'Haz clic dentro del museo para comenzar'}
        </span>
        </div>
      )}

      {!paused &&
        !pointerLocked && (
        <div
          className={
            styles.startOverlay
          }
        >
          <MousePointer2
            size={29}
          />

          <strong>
            Entrar al museo
          </strong>

          <span>
            Haz clic sobre la escena
          </span>
        </div>
      )}

      {!paused && (
        <div
          className={
            styles.mobileControls
          }
        >
        <button
          type="button"
          className={
            styles.moveUp
          }
          onPointerDown={() => {
            setMobileMovement(
              current => ({
                ...current,
                forward: true,
              })
            );
          }}
          onPointerUp={() => {
            setMobileMovement(
              current => ({
                ...current,
                forward: false,
              })
            );
          }}
          onPointerCancel={() => {
            setMobileMovement(
              current => ({
                ...current,
                forward: false,
              })
            );
          }}
          aria-label="Caminar adelante"
        >
          <ChevronUp
            size={22}
          />
        </button>

        <button
          type="button"
          className={
            styles.moveLeft
          }
          onPointerDown={() => {
            setMobileMovement(
              current => ({
                ...current,
                left: true,
              })
            );
          }}
          onPointerUp={() => {
            setMobileMovement(
              current => ({
                ...current,
                left: false,
              })
            );
          }}
          onPointerCancel={() => {
            setMobileMovement(
              current => ({
                ...current,
                left: false,
              })
            );
          }}
          aria-label="Caminar a la izquierda"
        >
          <ChevronLeft
            size={22}
          />
        </button>

        <button
          type="button"
          className={
            styles.moveRight
          }
          onPointerDown={() => {
            setMobileMovement(
              current => ({
                ...current,
                right: true,
              })
            );
          }}
          onPointerUp={() => {
            setMobileMovement(
              current => ({
                ...current,
                right: false,
              })
            );
          }}
          onPointerCancel={() => {
            setMobileMovement(
              current => ({
                ...current,
                right: false,
              })
            );
          }}
          aria-label="Caminar a la derecha"
        >
          <ChevronRight
            size={22}
          />
        </button>

        <button
          type="button"
          className={
            styles.moveDown
          }
          onPointerDown={() => {
            setMobileMovement(
              current => ({
                ...current,
                backward: true,
              })
            );
          }}
          onPointerUp={() => {
            setMobileMovement(
              current => ({
                ...current,
                backward: false,
              })
            );
          }}
          onPointerCancel={() => {
            setMobileMovement(
              current => ({
                ...current,
                backward: false,
              })
            );
          }}
          aria-label="Caminar hacia atrás"
        >
          <ChevronDown
            size={22}
          />
        </button>
        </div>
      )}
    </div>
  );
});

export default GalleryMuseum;

function MuseumArchitecture({
  layout,
}) {
  const floorDepth =
    layout.totalDepth +
    8;

  return (
    <group>
      <mesh
        position={[
          0,
          -0.07,
          -floorDepth /
            2 +
            4,
        ]}
        receiveShadow
      >
        <boxGeometry
          args={[
            10.4,
            0.14,
            floorDepth,
          ]}
        />

        <meshStandardMaterial
          color="#b9b0a3"
          roughness={0.86}
        />
      </mesh>

      <mesh
        position={[
          0,
          4.35,
          -floorDepth /
            2 +
            4,
        ]}
      >
        <boxGeometry
          args={[
            10.4,
            0.14,
            floorDepth,
          ]}
        />

        <meshStandardMaterial
          color="#242220"
          roughness={0.95}
        />
      </mesh>

      {layout.rooms.map(
        (
          room,
          index
        ) => {
          const backZ =
            room.centerZ -
            room.length /
              2;

          const openingWidth =
            2.6;

          const sideSegmentWidth =
            (
              room.width -
              openingWidth
            ) /
            2;

          return (
            <group
              key={
                room.id
              }
            >
              <Wall
                position={[
                  -room.width /
                    2,
                  2.1,
                  room.centerZ,
                ]}
                size={[
                  0.15,
                  4.2,
                  room.length,
                ]}
              />

              <Wall
                position={[
                  room.width /
                    2,
                  2.1,
                  room.centerZ,
                ]}
                size={[
                  0.15,
                  4.2,
                  room.length,
                ]}
              />

              {index === 0 && (
                <Wall
                  position={[
                    0,
                    2.1,
                    room.centerZ +
                    room.length /
                      2,
                  ]}
                  size={[
                    room.width,
                    4.2,
                    0.15,
                  ]}
                />
              )}

              {index <
                layout.rooms
                  .length -
                  1 && (
                <>
                  <Wall
                    position={[
                      -(
                        room.width /
                          2 -
                        sideSegmentWidth /
                          2
                      ),
                      2.1,
                      backZ,
                    ]}
                    size={[
                      sideSegmentWidth,
                      4.2,
                      0.15,
                    ]}
                  />

                  <Wall
                    position={[
                      room.width /
                        2 -
                      sideSegmentWidth /
                        2,
                      2.1,
                      backZ,
                    ]}
                    size={[
                      sideSegmentWidth,
                      4.2,
                      0.15,
                    ]}
                  />

                  <Wall
                    position={[
                      0,
                      3.68,
                      backZ,
                    ]}
                    size={[
                      openingWidth,
                      1.05,
                      0.15,
                    ]}
                  />
                </>
              )}

              {index ===
                layout.rooms
                  .length -
                  1 && (
                <Wall
                  position={[
                    0,
                    2.1,
                    backZ,
                  ]}
                  size={[
                    room.width,
                    4.2,
                    0.15,
                  ]}
                />
              )}

              <mesh
                position={[
                  0,
                  0.015,
                  room.centerZ,
                ]}
                rotation={[
                  -Math.PI /
                    2,
                  0,
                  0,
                ]}
                receiveShadow
              >
                <planeGeometry
                  args={[
                    room.width -
                      0.3,
                    room.length -
                      0.3,
                  ]}
                />

                <meshStandardMaterial
                  color={
                    index % 2 ===
                    0
                      ? '#bcb3a6'
                      : '#aaa195'
                  }
                  roughness={0.83}
                />
              </mesh>

              <Text
                position={[
                  0,
                  3.7,
                  room.centerZ +
                  room.length /
                    2 -
                  0.35,
                ]}
                fontSize={0.18}
                color={
                  room.accent
                }
                anchorX="center"
                anchorY="middle"
              >
                {`SALA ${String(index + 1).padStart(2, '0')}`}
              </Text>
            </group>
          );
        }
      )}
    </group>
  );
}

function Wall({
  position,
  size,
}) {
  return (
    <mesh
      position={
        position
      }
      receiveShadow
    >
      <boxGeometry
        args={size}
      />

      <meshStandardMaterial
        color="#f0ece5"
        roughness={0.92}
      />
    </mesh>
  );
}

function MuseumAuthorPortrait({
  author,
  layout,
  onAuthorClick,
  artworkClickBlockedUntilRef,
}) {
  const finalRoom =
    layout.rooms[
      layout.rooms.length -
      1
    ];

  if (
    !finalRoom ||
    !author
  ) {
    return null;
  }

  const backZ =
    finalRoom.centerZ -
    finalRoom.length /
      2 +
    0.09;

  return (
    <group
      position={[
        0,
        2.15,
        backZ,
      ]}
    >
      <mesh
        position={[
          0,
          0,
          -0.055,
        ]}
        castShadow
      >
        <boxGeometry
          args={[
            3.55,
            3.45,
            0.12,
          ]}
        />

        <meshStandardMaterial
          color="#a4518d"
          roughness={0.48}
          metalness={0.18}
        />
      </mesh>

      <mesh
        position={[
          0,
          0,
          0.025,
        ]}
        onPointerDown={event => {
          event.stopPropagation();

          event.nativeEvent
            ?.stopImmediatePropagation?.();
        }}
        onClick={event => {
          event.stopPropagation();

          event.nativeEvent
            ?.stopImmediatePropagation?.();

          const isBlocked =
            performance.now() <
            (
              artworkClickBlockedUntilRef
                ?.current ||
              0
            );

          if (isBlocked) {
            return;
          }

          onAuthorClick?.(
            author
          );
        }}
      >
        <planeGeometry
          args={[
            3.35,
            3.25,
          ]}
        />

        <meshStandardMaterial
          color="#151315"
          roughness={0.82}
        />
      </mesh>

      {author.photo_url ? (
        <MuseumAuthorImage
          imageUrl={
            author.photo_url
          }
        />
      ) : (
        <Text
          position={[
            0,
            0.25,
            0.06,
          ]}
          fontSize={1.15}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          {String(
            author.name ||
            'A'
          )
            .charAt(0)
            .toUpperCase()}
        </Text>
      )}

      <Text
        position={[
          0,
          -1.17,
          0.065,
        ]}
        fontSize={0.13}
        color="#d58ac1"
        anchorX="center"
        anchorY="middle"
      >
        EL AUTOR
      </Text>

      <Text
        position={[
          0,
          -1.42,
          0.065,
        ]}
        fontSize={0.2}
        color="#ffffff"
        maxWidth={3}
        textAlign="center"
        anchorX="center"
        anchorY="middle"
      >
        {author.name ||
          'Agorá Revista'}
      </Text>

      <Text
        position={[
          0,
          -1.68,
          0.065,
        ]}
        fontSize={0.085}
        color="#c8c0c5"
        anchorX="center"
        anchorY="middle"
      >
        HAZ CLIC PARA CONOCER SU SEMBLANZA
      </Text>
    </group>
  );
}

function MuseumAuthorImage({
  imageUrl,
}) {
  const texture =
    useTexture(
      imageUrl
    );

  useEffect(() => {
    texture.colorSpace =
      'srgb';

    texture.needsUpdate =
      true;
  }, [texture]);

  return (
    <mesh
      position={[
        0,
        0.28,
        0.06,
      ]}
    >
      <planeGeometry
        args={[
          2.25,
          2.25,
        ]}
      />

      <meshBasicMaterial
        map={
          texture
        }
        toneMapped={
          false
        }
      />
    </mesh>
  );
}

function MuseumArtworks({
  artworks,
  galleryAuthor,
  onPhotoClick,
  artworkClickBlockedUntilRef,
}) {
  return (
    <>
      {artworks.map(
        artwork => (
          <MuseumArtwork
            key={
              artwork.id
            }
            artwork={
              artwork
            }
            galleryAuthor={
              galleryAuthor
            }
            onPhotoClick={
              onPhotoClick
            }
            artworkClickBlockedUntilRef={
              artworkClickBlockedUntilRef
            }
          />
        )
      )}
    </>
  );
}

function MuseumArtwork({
  artwork,
  galleryAuthor,
  onPhotoClick,
  artworkClickBlockedUntilRef,
}) {
  const texture =
    useTexture(
      artwork.photo
        .image_url
    );

  const [
    hovered,
    setHovered,
  ] = useState(false);

  useEffect(() => {
    texture.colorSpace =
      'srgb';

    texture.needsUpdate =
      true;
  }, [texture]);

  const authorName =
    artwork.photo
      .photo_author ||
    galleryAuthor?.name ||
    'Agorá Revista';

  return (
    <group
      position={
        artwork.position
      }
      rotation={
        artwork.rotation
      }
    >
      <mesh
        position={[
          0,
          0,
          -0.035,
        ]}
        castShadow
      >
        <boxGeometry
          args={[
            artwork.width +
              0.16,
            artwork.height +
              0.16,
            0.09,
          ]}
        />

        <meshStandardMaterial
          color={
            hovered
              ? '#a4518d'
              : '#2b2927'
          }
          roughness={0.62}
        />
      </mesh>

      <mesh
        position={[
          0,
          0,
          0.02,
        ]}
        onPointerDown={event => {
          event.stopPropagation();

          event.nativeEvent
            ?.stopImmediatePropagation?.();
        }}
        onPointerOver={event => {
          event.stopPropagation();

          setHovered(true);

          document.body.style.cursor =
            'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);

          document.body.style.cursor =
            '';
        }}
        onClick={event => {
          event.stopPropagation();

          /*
           * Impide que el mismo clic llegue al listener
           * nativo de PointerLockControls en el Canvas.
           */
          event.nativeEvent
            ?.stopImmediatePropagation?.();

          const isResidualClickBlocked =
            performance.now() <
            (
              artworkClickBlockedUntilRef
                ?.current ||
              0
            );

          if (
            isResidualClickBlocked
          ) {
            return;
          }

          onPhotoClick?.(
            artwork.photo
          );
        }}
      >
        <planeGeometry
          args={[
            artwork.width,
            artwork.height,
          ]}
        />

        <meshBasicMaterial
          map={texture}
          toneMapped={false}
        />
      </mesh>

      <Text
        position={[
          0,
          -artwork.height /
            2 -
            0.22,
          0.055,
        ]}
        fontSize={0.105}
        color="#221f1d"
        maxWidth={
          artwork.width
        }
        textAlign="center"
        anchorX="center"
        anchorY="top"
      >
        {artwork.photo.title ||
          'Sin título'}
      </Text>

      <Text
        position={[
          0,
          -artwork.height /
            2 -
            0.38,
          0.055,
        ]}
        fontSize={0.072}
        color="#6a625c"
        maxWidth={
          artwork.width
        }
        textAlign="center"
        anchorX="center"
        anchorY="top"
      >
        {authorName}
      </Text>
    </group>
  );
}

function FirstPersonMovement({
  mobileMovement,
  bounds,
  paused = false,
}) {
  const {
    camera,
  } = useThree();

  const keysRef =
    useRef({
      KeyW: false,
      KeyS: false,
      KeyA: false,
      KeyD: false,
      ArrowUp: false,
      ArrowDown: false,
      ArrowLeft: false,
      ArrowRight: false,
    });

  const directionRef =
    useRef(
      new Vector3()
    );

  const forwardRef =
    useRef(
      new Vector3()
    );

  const rightRef =
    useRef(
      new Vector3()
    );

  useEffect(() => {
    const handleKeyDown =
      event => {
        if (
          Object.prototype
            .hasOwnProperty.call(
              keysRef.current,
              event.code
            )
        ) {
          keysRef.current[
            event.code
          ] = true;
        }
      };

    const handleKeyUp =
      event => {
        if (
          Object.prototype
            .hasOwnProperty.call(
              keysRef.current,
              event.code
            )
        ) {
          keysRef.current[
            event.code
          ] = false;
        }
      };

    window.addEventListener(
      'keydown',
      handleKeyDown
    );

    window.addEventListener(
      'keyup',
      handleKeyUp
    );

    return () => {
      window.removeEventListener(
        'keydown',
        handleKeyDown
      );

      window.removeEventListener(
        'keyup',
        handleKeyUp
      );
    };
  }, []);

  useFrame(
    (
      _state,
      delta
    ) => {
      if (paused) {
        return;
      }

      const keys =
        keysRef.current;

      const forward =
        keys.KeyW ||
        keys.ArrowUp ||
        mobileMovement.forward;

      const backward =
        keys.KeyS ||
        keys.ArrowDown ||
        mobileMovement.backward;

      const left =
        keys.KeyA ||
        keys.ArrowLeft ||
        mobileMovement.left;

      const right =
        keys.KeyD ||
        keys.ArrowRight ||
        mobileMovement.right;

      if (
        !forward &&
        !backward &&
        !left &&
        !right
      ) {
        return;
      }

      camera.getWorldDirection(
        forwardRef.current
      );

      forwardRef.current.y =
        0;

      forwardRef.current
        .normalize();

      rightRef.current
        .crossVectors(
          forwardRef.current,
          camera.up
        )
        .normalize();

      directionRef.current.set(
        0,
        0,
        0
      );

      if (forward) {
        directionRef.current.add(
          forwardRef.current
        );
      }

      if (backward) {
        directionRef.current.sub(
          forwardRef.current
        );
      }

if (left) {
  directionRef.current.sub(
    rightRef.current
  );
}

if (right) {
  directionRef.current.add(
    rightRef.current
  );
}

      directionRef.current
        .normalize()
        .multiplyScalar(
          delta * 3.4
        );

      camera.position.add(
        directionRef.current
      );

      camera.position.x =
        MathUtils.clamp(
          camera.position.x,
          bounds.minX,
          bounds.maxX
        );

      camera.position.z =
        MathUtils.clamp(
          camera.position.z,
          bounds.minZ,
          bounds.maxZ
        );

      camera.position.y =
        1.72;
    }
  );

  return null;
}