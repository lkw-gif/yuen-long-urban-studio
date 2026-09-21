'use client';
import { Localized } from '@/components/language-provider';
import { sitePath } from '@/lib/site-path';
import { LanguageSwitcher } from '@/components/language-provider';

export function StudioNav({ current }: { current: 'home' | 'concepts' | 'bridge' | 'design' | 'district' }) {
  return <Localized>{<><nav className="studio-nav" aria-label="工作空間">
    <a href={sitePath('/')} aria-current={current === 'home' ? 'page' : undefined}>街區現況</a>
    <a href={sitePath('/district-design/')} aria-current={current === 'district' ? 'page' : undefined}>街區設計</a>
    <a href={sitePath('/concepts/')} aria-current={current === 'concepts' ? 'page' : undefined}>概念模型<span>03</span></a>
    <a href={sitePath('/bridge-workshop/')} aria-current={current === 'bridge' ? 'page' : undefined}>天橋製作<span>08</span></a>
    <a href={sitePath('/3d-design/')} aria-current={current === 'design' ? 'page' : undefined}>3D design</a>
  </nav><LanguageSwitcher /></>}</Localized>;
}
