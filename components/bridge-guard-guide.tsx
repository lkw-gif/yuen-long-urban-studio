'use client';
/* oxlint-disable jsx-a11y/prefer-tag-over-role -- The fabrication diagrams are inline SVG images with accessible labels. */
import { Localized } from '@/components/language-provider';
import { BRIDGE_SIZE, BRIDGE_GUARD_HEIGHT, BRIDGE_GUARD_SECTIONS } from '@/lib/bridge-layout';

const mm = (value: number) => Number(value.toFixed(1));
const lengthRange = [Math.min(...BRIDGE_GUARD_SECTIONS.map(row => row.panelLength)), Math.max(...BRIDGE_GUARD_SECTIONS.map(row => row.panelLength))];

export function BridgeGuardSummary() {
  const minimum = mm(lengthRange[0]), maximum = mm(lengthRange[1]);
  const clearGap = BRIDGE_SIZE.bearerCentreSpacing - BRIDGE_SIZE.bearerDiameter;
  return <Localized><aside className="bridge-cut-summary" aria-label="護板及橋闊建議">
    <span className="bridge-guide-eyebrow">LASER CUT · mm</span><h2>護板長 × 闊</h2>
    <svg viewBox="0 0 330 130" role="img" aria-label="護板平放切割，長度依段落，闊度 12 mm。">
      <rect x="55" y="42" width="245" height="62" rx="1" fill="#c7dedc" fillOpacity=".45" stroke="#b8d1c7"/>
      <path d="M55 27H300 M55 21V33 M300 21V33 M37 42V104 M31 42H43 M31 104H43" fill="none" stroke="#efbb88" strokeWidth="1.5"/>
      <text x="177" y="17" textAnchor="middle">{minimum}–{maximum} mm</text>
      <text transform="translate(22 74) rotate(-90)" textAnchor="middle">{BRIDGE_GUARD_HEIGHT} mm</text>
      <text x="177" y="80" textAnchor="middle">平放的透明護板</text>
    </svg>
    <dl><div><dt>長度</dt><dd>{minimum}–{maximum} mm</dd></div>
      <div><dt>闊度（立起後的高度）</dt><dd>{BRIDGE_GUARD_HEIGHT} mm</dd></div>
      <div><dt>透明亞加力板厚度</dt><dd>{BRIDGE_SIZE.guardThickness} mm</dd></div></dl>
    <p className="bridge-guide-note">護板長度按橋邊微調，轉角先試拼。</p>
    <h3>建議橋闊</h3>
    <dl><div><dt>竹籤之間淨距</dt><dd>約 {clearGap} mm</dd></div>
      <div><dt>竹籤中心距</dt><dd>{BRIDGE_SIZE.bearerCentreSpacing} mm</dd></div>
      <div><dt>橋面板總闊</dt><dd>{BRIDGE_SIZE.width} mm</dd></div></dl>
    <p className="bridge-guide-note">以兩側承托梁的竹籤直徑 {BRIDGE_SIZE.bearerDiameter} mm 計；淨距量內側，中心距量兩支竹籤的中心。</p>
  </aside></Localized>;
}

export function BridgeYohoReference() {
  return <Localized><section className="bridge-guide-section bridge-yoho-reference" aria-labelledby="bridge-yoho-title">
    <span className="bridge-guide-eyebrow">YUEN LONG · REAL BRIDGE</span><h2 id="bridge-yoho-title">實例：YOHO Hub 跨元朗輕鐵天橋</h2>
    <div className="bridge-yoho-grid"><div><p>施工項目資料列出行人天橋長 46 m；同項目售樓書列出 FB1 淨闊要求為 6 m。</p>
      <p className="bridge-guide-note">淨闊是供行人通行的寬度，不包括兩側護板厚度。6 m 是批地設計要求，並非現場量度。</p>
      <p className="bridge-guide-note">本頁 3D 是獨立的組裝示範。護板闊 12 mm 是模型製作建議；來源沒有逐塊 YOHO 護板尺寸。</p>
    </div><table><caption>縮尺例子：1 : 200</caption><thead><tr><th>尺寸</th><th>實橋參考</th><th>縮尺模型</th></tr></thead><tbody>
      <tr><th scope="row">橋長</th><td>46 m</td><td>230 mm</td></tr><tr><th scope="row">通行淨闊要求</th><td>6 m</td><td>30 mm</td></tr>
    </tbody></table></div>
    <p className="bridge-scale-formula">實際尺寸（m）× 1000 ÷ 200 = 模型尺寸（mm）</p>
    <div className="bridge-guide-sources"><span>資料來源：</span><a href="https://www.goldwave.hk/portfolio/west-rail-yuen-long-station-property-development-yltl-no-510" target="_blank" rel="noopener noreferrer">Goldwave：橋長施工資料</a><a href="https://www.theyohohub.com.hk/file/20260825_YHB_SB_Part%201.pdf#page=129" target="_blank" rel="noopener noreferrer">YOHO Hub 官方售樓書：FB1 淨闊要求</a></div>
  </section></Localized>;
}
