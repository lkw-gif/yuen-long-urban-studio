import type { Metadata } from 'next';
import TowerWorkshop from '@/components/tower-workshop';
import './design.css';
export const dynamic = 'force-static';
export const metadata: Metadata = {
  title: '3D design · Tinkercad 住宅大樓教學',
  description:
    '從零認識 Tinkercad，以介面位置圖、逐步操作及互動 3D 模型，製作藍色住宅大樓。',
};
export default function DesignPage() {
  return <TowerWorkshop />;
}
