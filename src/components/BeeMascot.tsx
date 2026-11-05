import { useId } from 'react';

/**
 * Mascota de BEES: abeja cartoon original dibujada en SVG.
 *
 * Responsabilidades:
 * - Identidad visual única para el logotipo de la cabecera, el hero y el estado vacío del panel.
 * - Es decorativa: se oculta a los lectores de pantalla. El texto alternativo lo aporta el elemento
 *   que la contiene (por ejemplo, el `aria-label` del enlace del logotipo).
 *
 * Props:
 * - `className`: tamaño y posición desde CSS (el SVG ocupa el ancho de su caja).
 * - `animated`: activa el aleteo de las alas (clase `bee-mascot--animated`); el flotado lo aplica
 *   el contenedor. Ambas animaciones se desactivan con `prefers-reduced-motion`.
 * - `glow`: halo dorado detrás de la abeja, pensado para el hero.
 *
 * Los identificadores de degradados se generan con `useId` para poder mostrar varias abejas a la vez.
 */
interface BeeMascotProps {
  className?: string;
  animated?: boolean;
  glow?: boolean;
}

const INK = '#392318';
const GOLD = '#D99513';
const ROSE = '#F5B9C7';

export default function BeeMascot({ className = '', animated = false, glow = false }: BeeMascotProps) {
  // `useId` puede incluir caracteres no válidos en una referencia `url(#...)`.
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const ids = {
    halo: `bee-halo-${uid}`,
    body: `bee-body-${uid}`,
    wing: `bee-wing-${uid}`,
    clip: `bee-clip-${uid}`,
  };

  const classes = ['bee-mascot', animated ? 'bee-mascot--animated' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <svg
      className={classes}
      viewBox="0 0 200 180"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id={ids.halo}>
          <stop offset="0%" stopColor="#FFE38A" stopOpacity="0.95" />
          <stop offset="60%" stopColor="#FFC928" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#FFC928" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={ids.body} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFE16B" />
          <stop offset="55%" stopColor="#FFC928" />
          <stop offset="100%" stopColor="#F0A818" />
        </linearGradient>
        <linearGradient id={ids.wing} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.92" />
          <stop offset="100%" stopColor="#D7C8F4" stopOpacity="0.55" />
        </linearGradient>
        <clipPath id={ids.clip}>
          <ellipse cx="88" cy="108" rx="58" ry="46" />
        </clipPath>
      </defs>

      {glow && <circle cx="100" cy="94" r="88" fill={`url(#${ids.halo})`} />}

      {/* Ala trasera */}
      <g className="bee-wing bee-wing--back">
        <ellipse
          cx="76"
          cy="50"
          rx="27"
          ry="40"
          transform="rotate(-24 76 50)"
          fill={`url(#${ids.wing})`}
          stroke={INK}
          strokeWidth="3.5"
        />
      </g>

      {/* Patas */}
      <path
        d="M74 150q-2 10-9 13M98 152q0 10-5 14"
        fill="none"
        stroke={INK}
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Aguijón y cuerpo con franjas */}
      <path d="M33 104 16 114l18 8z" fill={INK} strokeLinejoin="round" />
      <ellipse cx="88" cy="108" rx="58" ry="46" fill={`url(#${ids.body})`} />
      <g clipPath={`url(#${ids.clip})`} fill={INK}>
        <rect x="46" y="50" width="15" height="120" rx="6" transform="rotate(10 53 110)" />
        <rect x="76" y="50" width="15" height="120" rx="6" transform="rotate(10 83 110)" />
      </g>
      <ellipse cx="88" cy="108" rx="58" ry="46" fill="none" stroke={INK} strokeWidth="4" />
      <ellipse cx="96" cy="84" rx="18" ry="7" transform="rotate(-14 96 84)" fill="#FFFFFF" opacity="0.4" />

      {/* Ala delantera: translúcida para dejar ver las franjas */}
      <g className="bee-wing bee-wing--front">
        <ellipse
          cx="104"
          cy="46"
          rx="25"
          ry="41"
          transform="rotate(18 104 46)"
          fill={`url(#${ids.wing})`}
          stroke={INK}
          strokeWidth="3.5"
        />
        <path d="M100 26q6 12 4 30" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
      </g>

      {/* Antenas con puntas doradas */}
      <path
        d="M128 64C122 44 113 33 104 26M153 64c5-22 15-32 25-37"
        fill="none"
        stroke={INK}
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="103" cy="24" r="7" fill={GOLD} stroke={INK} strokeWidth="3" />
      <circle cx="180" cy="26" r="7" fill={GOLD} stroke={INK} strokeWidth="3" />

      {/* Cabeza y cara */}
      <circle cx="140" cy="100" r="40" fill={`url(#${ids.body})`} stroke={INK} strokeWidth="4" />
      <ellipse cx="128" cy="97" rx="7" ry="9.5" fill={INK} />
      <ellipse cx="156" cy="97" rx="7" ry="9.5" fill={INK} />
      <circle cx="130.5" cy="92.5" r="2.8" fill="#FFFFFF" />
      <circle cx="158.5" cy="92.5" r="2.8" fill="#FFFFFF" />
      <ellipse cx="119" cy="112" rx="7" ry="4.5" fill={ROSE} />
      <ellipse cx="166" cy="112" rx="7" ry="4.5" fill={ROSE} />
      <path d="M133 113q9 9 18 0" fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />

      {/* Destello dorado */}
      <path
        d="M186 66c.8 5 3 7.2 8 8-5 .8-7.2 3-8 8-.8-5-3-7.2-8-8 5-.8 7.2-3 8-8z"
        fill={GOLD}
        stroke={INK}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
