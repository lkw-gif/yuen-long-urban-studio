'use client';

import type { CSSProperties } from 'react';
import { PLA_MATERIALS, DEFAULT_PLA_MATERIAL, type PlaMaterialId } from '@/lib/building-materials';

export function BuildingMaterialPicker({ value, language, onChange }: {
  value?: PlaMaterialId; language: string; onChange: (id: PlaMaterialId) => void;
}) {
  const selected = value ?? DEFAULT_PLA_MATERIAL;
  return <div className="dd-material-grid">
    {PLA_MATERIALS.map(material => <button type="button" key={material.id}
      aria-pressed={selected === material.id} data-material={material.id}
      onClick={() => onChange(material.id)}>
      <span className={`dd-material-swatch${material.transparent ? ' transparent' : ''}`}
        style={{ '--material-color': material.color } as CSSProperties} aria-hidden="true" />
      <span>{language === 'en' ? material.nameEn : material.nameZh}</span>
    </button>)}
  </div>;
}
