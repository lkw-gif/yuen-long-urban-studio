import type { Metadata } from 'next';
import ConceptWorkspace from '@/components/concept-workspace';
export const dynamic = 'force-static';
export const metadata:Metadata={title:'概念模型 · Urban Studio',description:'探索生活社區、天橋社區與垂直城市三個可旋轉的 3D 概念模型，對照原圖並匯出至 Blender。'};
export default function ConceptsPage(){return <ConceptWorkspace/>;}
