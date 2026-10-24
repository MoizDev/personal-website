// Each piece is printed with a small texture that hints at its project.
// Units are tangram lattice units (a large triangle's long side is 4), and
// the patterns ride along with the piece as it turns.

const ink = (tone: string, opacity: number) => ({ fill: `var(--${tone}-ink)`, fillOpacity: opacity });

export function PiecePatterns() {
  return (
    <>
      {/* Factful: lines of an essay, one claim highlighted */}
      <pattern id="pattern-lines" width="1.6" height="0.52" patternUnits="userSpaceOnUse">
        <rect x="0.1" y="0.1" width="1.3" height="0.05" rx="0.025" style={ink("blue", 0.32)} />
        <rect x="0.42" y="0.322" width="0.62" height="0.116" rx="0.03" style={ink("blue", 0.16)} />
        <rect x="0.1" y="0.355" width="0.95" height="0.05" rx="0.025" style={ink("blue", 0.32)} />
      </pattern>

      {/* Weekloom: staggered gantt bars */}
      <pattern id="pattern-gantt" width="1.3" height="0.5" patternUnits="userSpaceOnUse">
        <rect x="0.08" y="0.08" width="0.66" height="0.13" rx="0.065" style={ink("orange", 0.34)} />
        <rect x="0.5" y="0.32" width="0.6" height="0.13" rx="0.065" style={ink("orange", 0.2)} />
      </pattern>

      {/* Bricked: lego studs */}
      <pattern id="pattern-studs" width="0.36" height="0.36" patternUnits="userSpaceOnUse">
        <circle cx="0.18" cy="0.18" r="0.105" style={ink("yellow", 0.16)} />
        <circle
          cx="0.18"
          cy="0.18"
          r="0.105"
          fill="none"
          style={{ stroke: "var(--yellow-ink)", strokeOpacity: 0.38 }}
          strokeWidth="0.016"
        />
      </pattern>

      {/* WMOJ: lines of code */}
      <pattern id="pattern-code" width="0.96" height="0.22" patternUnits="userSpaceOnUse">
        <rect x="0.06" y="0.085" width="0.16" height="0.05" rx="0.025" style={ink("green", 0.5)} />
        <rect x="0.28" y="0.085" width="0.44" height="0.05" rx="0.025" style={ink("green", 0.24)} />
      </pattern>

      {/* WatWiki: ruled notebook paper */}
      <pattern id="pattern-ruled" width="1" height="0.17" patternUnits="userSpaceOnUse">
        <rect x="0" y="0.155" width="1" height="0.014" style={ink("purple", 0.4)} />
      </pattern>

      {/* Scire: a calendar grid */}
      <pattern id="pattern-calendar" width="0.21" height="0.21" patternUnits="userSpaceOnUse">
        <rect x="0.03" y="0.03" width="0.15" height="0.15" rx="0.035" style={ink("pink", 0.2)} />
      </pattern>

      {/* Jazzba: a warehouse barcode */}
      <pattern id="pattern-barcode" width="0.5" height="1" patternUnits="userSpaceOnUse">
        <rect x="0.02" y="0" width="0.04" height="1" style={ink("red", 0.26)} />
        <rect x="0.1" y="0" width="0.018" height="1" style={ink("red", 0.26)} />
        <rect x="0.15" y="0" width="0.07" height="1" style={ink("red", 0.26)} />
        <rect x="0.26" y="0" width="0.018" height="1" style={ink("red", 0.26)} />
        <rect x="0.31" y="0" width="0.035" height="1" style={ink("red", 0.26)} />
        <rect x="0.39" y="0" width="0.025" height="1" style={ink("red", 0.26)} />
      </pattern>
    </>
  );
}
