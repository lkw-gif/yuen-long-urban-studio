import type { Metadata } from 'next';
import LSchoolWorkshop from '@/components/l-school-workshop';
import './school.css';

export const metadata: Metadata = {
  title: '木板設計 · L 形學校拆件教學',
  description: '互動 3D 模型教學：拆解 2 mm 木板 L 形學校的 12 塊面板，規劃窗門刻印並按次序組裝。',
};

export default function WoodDesignPage() {
  return <LSchoolWorkshop />;
}
