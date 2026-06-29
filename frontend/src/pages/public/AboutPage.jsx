import { Link } from 'react-router-dom';
import { ArrowRight, Mail } from 'lucide-react';
import styles from './AboutPage.module.css';

export default function AboutPage() {
  return (
    <main className={styles.page}>

      <section className={styles.hero}>
        <div className={styles.heroOverlay}>
          <span className={styles.kicker}>Agorá Revista</span>

          <h1>Quiénes somos</h1>

          <p>
            Un espacio digital dedicado a la difusión, reflexión y diálogo en torno
            al arte y la cultura contemporánea.
          </p>
        </div>
      </section>

      <section className={styles.intro}>
        <div className={styles.introText}>
          <span className={styles.sectionNumber}>01</span>

          <h2>La conversación empieza aquí</h2>

          <p>
            Agorá Revista es un espacio digital dedicado a la difusión, reflexión
            y diálogo en torno al arte y la cultura contemporánea. Desde la
            escritura, la imagen y la palabra crítica, buscamos abrir un punto de
            encuentro donde converjan voces diversas, ideas emergentes y
            manifestaciones artísticas que configuran nuestro presente.
          </p>

          <p>
            Bajo la dirección editorial de Francisco Bojórquez y la coordinación
            de contenido de Issac Cordero, Agorá Revista se propone ser una
            plataforma abierta, viva y en constante movimiento, donde la creación
            y el pensamiento se encuentren para expandir los límites de lo posible.
          </p>
        </div>

        <div className={styles.symbolCard}>
          <span>Λ</span>
        </div>
      </section>

      <section className={styles.openSection}>
        <div className={styles.openVisual}>
          <span>Arte</span>
          <span>Palabra</span>
          <span>Crítica</span>
          <span>Imagen</span>
        </div>

        <div className={styles.openText}>
          <span className={styles.sectionNumber}>02</span>

          <h2>Una revista abierta</h2>

          <p>
            En Agorá Revista creemos en el poder del arte y la palabra como puntos
            de encuentro. Por ello, abrimos una invitación a artistas, escritores,
            fotógrafos, cineastas, periodistas y creadores que deseen compartir su
            trabajo, sus ideas y su mirada sobre el mundo.
          </p>

          <p>
            Buscamos colaboraciones en literatura, ensayo, opinión, cine, artes
            plásticas, música, fotografía y periodismo cultural. Queremos ser un
            espacio donde la creación dialogue con la crítica, donde las obras
            encuentren lectores y las voces se amplifiquen.
          </p>

          <p>
            También extendemos la invitación a instituciones, organismos culturales
            y proyectos independientes interesados en cobertura especial de
            eventos, festivales, ferias o actividades artísticas.
          </p>

          <div className={styles.actions}>
            <Link to="/convocatorias" className={styles.cta}>
              Ver convocatorias <ArrowRight size={15} />
            </Link>

            <a href="mailto:contactoagorarevista@gmail.com" className={styles.mailCta}>
              <Mail size={15} />
              contactoagorarevista@gmail.com
            </a>
          </div>
        </div>
      </section>

      <section className={styles.directory}>
        <div className={styles.directoryHeader}>
          <span className={styles.sectionNumber}>03</span>
          <h2>Directorio</h2>
        </div>

        <div className={styles.directoryGrid}>
          <article className={styles.personCard}>
            <span className={styles.role}>Dirección editorial</span>

            <h3>Francisco Bojórquez</h3>

            <p>
              Poeta, columnista, editor multimedia y gestor cultural. Licenciado
              en Ciencias de la Comunicación por la Universidad Autónoma de
              Occidente, con especialización en Medios Masivos. Desde 2021 escribe
              la columna Desde aquí en El Debate, donde reflexiona sobre cultura,
              arte, filosofía y la condición humana.
            </p>

            <p>
              Sus poemas han sido publicados en Timonel, revista del Instituto
              Sinaloense de Cultura, y en la plana poética independiente Sol
              Filamento. Ha colaborado con reseñas y textos en revistas digitales
              como Cronopios y Divergencias.
            </p>

            <p>
              Forma parte del colectivo poético Nadie nos lee y del colectivo
              creativo Amorfo, donde impulsa actividades que cruzan lo literario
              con lo escénico y audiovisual.
            </p>
          </article>

          <article className={styles.personCard}>
            <span className={styles.role}>Coordinación de contenido</span>

            <h3>Issac Cordero</h3>

            <p>
              Poeta, productor audiovisual, fotógrafo y gestor cultural.
              Licenciado en Ciencias de la Comunicación por la Universidad
              Autónoma de Occidente.
            </p>

            <p>
              Ha sido miembro de diversos programas de fomento y promoción
              literaria como Yo soy lector y el colectivo poético Nadie nos lee.
            </p>

            <p>
              Fundador de Amorfo, una productora y estudio creativo en la que
              desarrolla proyectos audiovisuales y cortometrajes. Siempre en busca
              de dar forma a las ideas.
            </p>
          </article>
        </div>
      </section>

    </main>
  );
}