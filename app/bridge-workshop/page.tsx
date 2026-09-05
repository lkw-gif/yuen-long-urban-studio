import type { Metadata } from 'next';
import BridgeWorkshop from '@/components/bridge-workshop';
import './workshop.css';

export const dynamic = 'force-static';
export const metadata: Metadata = {
  title: '天橋製作教學 · Urban Studio',
  description: '八個步驟配合互動 3D 模型，用牙籤、木板、卡紙和亞加力，製作中學生的天橋社區展示模型。',
};
export default function BridgeWorkshopPage() { return <BridgeWorkshop />; }
