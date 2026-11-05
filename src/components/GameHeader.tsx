import BeeMascot from './BeeMascot';

/**
 * Cabecera de BEES con forma de letrero de madera del bosque.
 *
 * Contiene el logotipo (enlace al inicio) y el lema del producto. No incluye navegación ni ajustes
 * porque la aplicación no tiene esas funcionalidades; si se añaden, deben ir en este componente.
 * Se muestra tanto en la pantalla de opciones como durante el juego.
 */
export default function GameHeader() {
  return (
    <header className="site-header">
      <div className="site-header__plank">
        <a className="brand" href="/" aria-label="BEES, inicio">
          <span className="brand__badge">
            <BeeMascot className="brand__bee" />
          </span>
          <span className="brand__name">BEES</span>
        </a>

        <span className="site-header__divider" aria-hidden="true" />

        <span className="site-header__tagline">El juego de las decisiones</span>
      </div>
    </header>
  );
}
