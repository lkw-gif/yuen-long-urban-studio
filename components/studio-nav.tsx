import { sitePath } from '@/lib/site-path';

export function StudioNav({ current }: { current: 'home' | 'concepts' | 'bridge' }) {
  return <nav className="studio-nav" aria-label="工作空間">
    <a href={sitePath('/')} aria-current={current === 'home' ? 'page' : undefined}>街區現況</a>
    <a href={sitePath('/concepts/')} aria-current={current === 'concepts' ? 'page' : undefined}>概念模型<span>03</span></a>
    <a href={sitePath('/bridge-workshop/')} aria-current={current === 'bridge' ? 'page' : undefined}>天橋製作<span>08</span></a>
  </nav>;
}
