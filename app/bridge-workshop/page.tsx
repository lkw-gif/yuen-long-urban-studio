import type { Metadata } from 'next';
import BridgeWorkshop from '@/components/bridge-workshop';
import './workshop.css';

export const dynamic = 'force-static';
export const metadata: Metadata = {
  title: '香港天橋製作 · Urban Studio',
  description: '逐步建構連接三幢建築的香港天橋模型：竹籤支柱與承托架、透明亞加力橋面及兩側護板。',
};
export default function BridgeWorkshopPage() { return <BridgeWorkshop />; }
