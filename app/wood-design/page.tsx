import type { Metadata } from 'next';
import WoodWorkshop from '@/components/wood-workshop';
import './school.css';

export const metadata: Metadata = {
  title: '木板設計 · L 形學校與三層商場',
  description: '互動 3D 木板建築教學：L 形學校 12 件、三層商場 18 件，逐件核對切割尺寸、窗門刻印和組裝次序。',
};

export default function WoodDesignPage() {
  return <WoodWorkshop />;
}
