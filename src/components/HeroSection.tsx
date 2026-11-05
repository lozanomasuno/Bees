import BeeMascot from './BeeMascot';
import { IconSparkle } from './icons';

/**
 * Bienvenida de la pantalla de opciones: lema, subtítulo y la abeja mascota.
 *
 * `App` solo la muestra mientras se preparan las opciones; durante el juego se oculta para que el
 * escenario quede visible sin desplazarse. El título es el `h1` de la página.
 */
export default function HeroSection() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__copy">
        <p className="hero__badge">
          <IconSparkle className="hero__badge-icon" />
          Pequeñas decisiones, grandes aventuras
        </p>

        <h1 id="hero-title" className="hero__title">
          Deja que la <span className="hero__title-magic">magia decida.</span>
        </h1>

        <p className="hero__subtitle">
          Prepara tus opciones y descubre tu destino.
        </p>
      </div>

      <div className="hero__art" aria-hidden="true">
        <div className="hero__float">
          <BeeMascot className="hero__bee" animated glow />
        </div>
        <span className="hero__spark hero__spark--one">
          <IconSparkle />
        </span>
        <span className="hero__spark hero__spark--two">
          <IconSparkle />
        </span>
        <span className="hero__spark hero__spark--three">
          <IconSparkle />
        </span>
      </div>
    </section>
  );
}
