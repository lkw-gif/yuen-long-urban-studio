'use client';
/* oxlint-disable jsx-a11y/prefer-tag-over-role -- The fabrication diagrams are inline SVG images with accessible labels. */
import { useState } from 'react';
import { Localized } from '@/components/language-provider';
import { BRIDGE_SIZE, BRIDGE_LAYOUT, BRIDGE_GUARD_HEIGHT, BRIDGE_GUARD_SECTIONS, BRIDGE_ENTRY_PANELS } from '@/lib/bridge-layout';

const mm = (value: number) => Number(value.toFixed(1));
const colours = ['#eab27d', '#87c4d4', '#b9abd9'];
const total = BRIDGE_GUARD_SECTIONS.reduce((sum, row) => sum + row.quantity, 0);
const lengthRange = [Math.min(...BRIDGE_GUARD_SECTIONS.map(row => row.panelLength)), Math.max(...BRIDGE_GUARD_SECTIONS.map(row => row.panelLength))];

export function BridgeGuardSummary({ step }: { step: number }) {
  const entryOnly = step === 6, complete = step === 7;
  const minimum = entryOnly || complete ? 12 : mm(lengthRange[0]);
  const maximum = entryOnly ? 12 : mm(lengthRange[1]);
  const quantity = entryOnly ? BRIDGE_ENTRY_PANELS.length : complete ? total + BRIDGE_ENTRY_PANELS.length : total;
  return <Localized><aside className="bridge-cut-summary" aria-label="護板製作尺寸">
    <span className="bridge-guide-eyebrow">LASER CUT · mm</span><h2>護板長 × 闊</h2>
    <svg viewBox="0 0 330 130" role="img" aria-label="護板平放切割，長度依段落，闊度 12 mm。">
      <rect x="55" y="42" width="245" height="62" rx="1" fill="#c7dedc" fillOpacity=".45" stroke="#b8d1c7"/>
      <path d="M55 27H300 M55 21V33 M300 21V33 M37 42V104 M31 42H43 M31 104H43" fill="none" stroke="#efbb88" strokeWidth="1.5"/>
      <text x="177" y="17" textAnchor="middle">{minimum === maximum ? `${minimum} mm` : `${minimum}–${maximum} mm`}</text>
      <text transform="translate(22 74) rotate(-90)" textAnchor="middle">{BRIDGE_GUARD_HEIGHT} mm</text>
      <text x="177" y="80" textAnchor="middle">平放的透明護板</text>
    </svg>
    <dl><div><dt>長度</dt><dd>{minimum === maximum ? `${minimum} mm` : `${minimum}–${maximum} mm`}</dd></div>
      <div><dt>闊度（立起後的高度）</dt><dd>{BRIDGE_GUARD_HEIGHT} mm</dd></div>
      <div><dt>透明亞加力板厚度</dt><dd>{BRIDGE_SIZE.guardThickness} mm</dd></div>
      <div><dt>{entryOnly ? '入口接駁護板' : complete ? '完整模型護板' : '主橋及分支護板'}</dt><dd>{quantity} 塊</dd></div></dl>
    <p>先按段落數板，再切長方形，最後沿橋邊試拼。</p>
    <a href="#bridge-guard-cut-list">查看每段尺寸及位置 ↓</a>
  </aside></Localized>;
}

export function BridgeGuardCutList() {
  const [active, setActive] = useState('A1');
  return <Localized><section className="bridge-guide-section" id="bridge-guard-cut-list" aria-labelledby="bridge-cut-title">
    <span className="bridge-guide-eyebrow">CUT LIST · STEP 06 / 07</span><h2 id="bridge-cut-title">逐段點算兩側護板</h2>
    <p>按表內段落，在俯視圖找位置。每段平均分成數塊，單塊長度不超過 28 mm。</p>
    <div className="bridge-cut-layout"><div className="bridge-guard-map">
      <svg viewBox="-162 -125 318 247" role="img" aria-label="護板位置俯視圖；A、B、C 為三組橋邊，入口及分岔保持暢通。">
        {[BRIDGE_LAYOUT.main, BRIDGE_LAYOUT.branch, ...BRIDGE_LAYOUT.entrances.map(e => e.outline)].map((outline, i) => <polygon key={i} points={outline.map(p => p.join(',')).join(' ')} fill="#6e8880" fillOpacity=".27" stroke="#88998f" strokeWidth=".5"/>)}
        {BRIDGE_GUARD_SECTIONS.map(row => {
          const nx = -(row.b[1] - row.a[1]) / row.length, ny = (row.b[0] - row.a[0]) / row.length;
          return <g key={row.id}><line x1={row.a[0]} y1={row.a[1]} x2={row.b[0]} y2={row.b[1]} stroke={colours[row.side]} strokeWidth={active === row.id ? 5 : 2}/>
            <text x={(row.a[0] + row.b[0]) / 2 + nx * 12} y={(row.a[1] + row.b[1]) / 2 + ny * 12} textAnchor="middle" fill={colours[row.side]}>{row.id}</text></g>;
        })}
        {BRIDGE_LAYOUT.entrances.map((e, i) => <text key={e.id} x={i === 0 ? -144 : i === 1 ? 138 : 42} y={i === 0 ? -22 : i === 1 ? -82 : 102} textAnchor="middle">入口</text>)}
      </svg>
      <p>橋邊遇到轉角、分岔便分段；入口不要封住。</p>
      <p className="bridge-guide-note">以下為本頁模型的名義尺寸，四捨五入至 0.1 mm。轉角先試拼，再微調端位；切縫補償按學校機器設定。</p>
    </div><div className="bridge-cut-table-wrap"><table><caption>透明護板切割清單 · 單位 mm</caption><thead><tr><th>段落</th><th>每塊長 × 闊</th><th>數量</th></tr></thead><tbody>
      {BRIDGE_GUARD_SECTIONS.map(row => <tr key={row.id} className={active === row.id ? 'active' : undefined}><th scope="row"><button aria-pressed={active === row.id} onClick={() => setActive(row.id)}>{row.id}</button></th><td>{mm(row.panelLength)} × {BRIDGE_GUARD_HEIGHT}</td><td>{row.quantity}</td></tr>)}
      <tr><th scope="row">第 7 步：入口</th><td>12 × {BRIDGE_GUARD_HEIGHT}</td><td>{BRIDGE_ENTRY_PANELS.length}</td></tr>
    </tbody><tfoot><tr><th scope="row">完成模型合共</th><td>厚 {BRIDGE_SIZE.guardThickness} mm</td><td>{total + BRIDGE_ENTRY_PANELS.length} 塊</td></tr></tfoot></table></div></div>
  </section></Localized>;
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
