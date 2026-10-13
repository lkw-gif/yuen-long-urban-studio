export const PLA_MATERIALS = [
  { id: 'matte-white', nameZh: 'PLA啞光白色', nameEn: 'PLA Matte White', color: '#f1f2f0', transparent: false },
  { id: 'matte-black', nameZh: 'PLA啞光黑色', nameEn: 'PLA Matte Black', color: '#242626', transparent: false },
  { id: 'matte-cobalt-blue', nameZh: 'PLA啞光鈷藍色', nameEn: 'PLA Matte Cobalt Blue', color: '#186fa7', transparent: false },
  { id: 'matte-sky-blue', nameZh: 'PLA啞光蔚藍色', nameEn: 'PLA Matte Sky Blue', color: '#50bfd6', transparent: false },
  { id: 'matte-red', nameZh: 'PLA啞光紅色', nameEn: 'PLA Matte Red', color: '#c73932', transparent: false },
  { id: 'matte-purple', nameZh: 'PLA啞光紫色', nameEn: 'PLA Matte Purple', color: '#9574be', transparent: false },
  { id: 'matte-lake-green', nameZh: 'PLA啞光湖綠', nameEn: 'PLA Matte Lake Green', color: '#64cfa6', transparent: false },
  { id: 'transparent-blue', nameZh: 'PLA透明藍', nameEn: 'PLA Transparent Blue', color: '#419ee0', transparent: true },
  { id: 'transparent-light-pink', nameZh: 'PLA透明淺粉', nameEn: 'PLA Transparent Light Pink', color: '#edb5c8', transparent: true },
  { id: 'transparent-jade-green', nameZh: 'PLA透明翡翠綠', nameEn: 'PLA Transparent Jade Green', color: '#29ba75', transparent: true },
] as const;
export type PlaMaterialId = typeof PLA_MATERIALS[number]['id'];
export const DEFAULT_PLA_MATERIAL: PlaMaterialId = 'matte-cobalt-blue';
export function isPlaMaterialId(value: unknown): value is PlaMaterialId {
  return PLA_MATERIALS.some(material => material.id === value);
}
export function plaMaterial(id?: PlaMaterialId) {
  return PLA_MATERIALS.find(material => material.id === id) ?? PLA_MATERIALS[2];
}
export function materialName(id: PlaMaterialId | undefined, language: string) {
  const material = plaMaterial(id);
  return language === 'en' ? material.nameEn : material.nameZh;
}
