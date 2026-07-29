// Sony CSL marks, using the official artwork supplied with the handoff.
//
//   variant  symbol      the geometric mark alone (nav, footer)
//            horizontal  mark + wordmark on one line
//            twoLine     mark above the wordmark
//   tone     color | dark | light
//
// Sized by height; each variant's intrinsic ratio keeps the width correct.

import symbolColor from '../assets/logos/symbol-color.png';
import symbolDark from '../assets/logos/symbol-dark.png';
import symbolLight from '../assets/logos/symbol-light.png';
import horizontalDark from '../assets/logos/logo-horizontal-dark.png';
import horizontalLight from '../assets/logos/logo-horizontal-light.png';
import twoLineDark from '../assets/logos/logo-2line-dark.png';
import twoLineLight from '../assets/logos/logo-2line-light.png';

const ART = {
  symbol: { color: symbolColor, dark: symbolDark, light: symbolLight, ratio: 140 / 94 },
  horizontal: {
    color: horizontalDark,
    dark: horizontalDark,
    light: horizontalLight,
    ratio: 619 / 104,
  },
  twoLine: { color: twoLineDark, dark: twoLineDark, light: twoLineLight, ratio: 181 / 167 },
};

export function Logo({ variant = 'symbol', tone = 'color', height = 22, alt = 'Sony CSL', className }) {
  const art = ART[variant] ?? ART.symbol;
  const src = art[tone] ?? art.color;
  return (
    <img
      src={src}
      alt={alt}
      width={Math.round(height * art.ratio)}
      height={height}
      className={className}
      style={{ height, width: 'auto', display: 'block', flex: '0 0 auto' }}
    />
  );
}
