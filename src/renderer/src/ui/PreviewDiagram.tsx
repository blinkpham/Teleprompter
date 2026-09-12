import type { Technique } from '../../../shared/catalog-types';

interface PreviewDiagramProps {
  readonly technique: Technique;
  readonly compact?: boolean;
}

export function PreviewDiagram({ technique, compact = false }: PreviewDiagramProps) {
  const id = `diagram-${technique.id}-${compact ? 'compact' : 'full'}`;
  const marker = technique.previewId;
  return (
    <div className="preview-wrap">
      <span className="diagram-label">Diagram</span>
      <svg className="preview-diagram" viewBox="0 0 600 400" role="img" aria-labelledby={id}>
        <title id={id}>{technique.title} instructional diagram</title>
        <rect width="600" height="400" rx="28" fill="#dcebe9" />
        <rect x="92" y="74" width="416" height="252" rx="22" fill="#f8fcfb" stroke="#4e8585" strokeWidth="5" />
        <path d="M124 278 L220 178 L302 244 L390 132 L478 278" fill="none" stroke="#8bb1af" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="194" cy="144" r="32" fill="#c4dedb" stroke="#4e8585" strokeWidth="5" />
        <rect x="360" y="190" width="78" height="58" rx="12" fill="#e9b8ae" stroke="#4e8585" strokeWidth="5" />
        <g fill="none" stroke="#eb806d" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round">
          {marker === 'remove-one-thing' && <><circle cx="400" cy="218" r="54" strokeDasharray="10 14" /><path d="M366 184 L434 252 M434 184 L366 252" /></>}
          {marker === 'multi-reference-composite' && <><path d="M76 40 L118 72 M524 40 L482 72" /><rect x="36" y="12" width="64" height="44" rx="8" /><rect x="500" y="12" width="64" height="44" rx="8" /></>}
          {marker === 'style-tone-transfer' && <><path d="M244 110 L356 110" /><circle cx="248" cy="110" r="11" fill="#2a9d94" /><circle cx="278" cy="110" r="11" fill="#ed806c" /><circle cx="308" cy="110" r="11" fill="#f2d79b" /></>}
          {marker === 'face-identity-transfer' && <><ellipse cx="194" cy="144" rx="22" ry="28" /><path d="M194 116 L194 172" /></>}
          {marker === 'pose-transfer' && <><path d="M408 182 L432 142 L460 178 M432 142 L398 118" /><circle cx="432" cy="106" r="18" /></>}
          {marker === 'perspective-correction' && <><path d="M120 94 L300 200 L480 94 M120 306 L300 200 L480 306" /><circle cx="300" cy="200" r="14" /></>}
          {marker === 'camera-lock' && <><rect x="156" y="122" width="288" height="164" rx="16" strokeDasharray="18 12" /><path d="M140 110 L108 86 M460 110 L492 86" /></>}
          {marker === 'reframe' && <><rect x="170" y="104" width="260" height="192" rx="12" /><path d="M170 104 L150 84 M430 104 L450 84 M170 296 L150 316 M430 296 L450 316" /></>}
          {marker === 'clean-environment' && <><path d="M378 170 L432 224 M432 170 L378 224" /><circle cx="405" cy="197" r="50" strokeDasharray="10 14" /></>}
          {marker === 'product-fidelity' && <><rect x="346" y="166" width="106" height="106" rx="16" /><path d="M352 146 L446 146" /></>}
          {marker === 'controlled-motion' && <><path d="M356 184 C414 154 454 164 488 138 M360 224 C424 216 462 232 500 214" strokeDasharray="20 14" /></>}
          {marker === 'quality-restoration' && <><path d="M352 178 L390 216 L460 146 M352 238 L390 276 L460 206" /><path d="M338 148 L326 136 M476 278 L488 290" /></>}
          {marker === 'clean-commercial' && <><path d="M174 256 L300 116 L426 256" /><path d="M216 256 L216 206 L384 206 L384 256" /></>}
          {marker === 'markup-directed-edit' && <><path d="M340 126 L474 260" /><path d="M474 126 L340 260" /><circle cx="408" cy="194" r="72" strokeDasharray="12 12" /></>}
          {marker === 'surgical-edit' && <><path d="M362 134 L440 134 L440 212 L362 212 Z" /></>}
        </g>
        <text x="116" y="356" fill="#6c9292" fontSize="16" fontFamily="system-ui, sans-serif" letterSpacing="2">SOURCE-FAITHFUL DIRECTION</text>
      </svg>
    </div>
  );
}
