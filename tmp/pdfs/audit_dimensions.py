import json
from pathlib import Path

ROOT=Path(__file__).resolve().parent
models=json.loads((ROOT/'pack_models_a.json').read_text(encoding='utf-8'))+json.loads((ROOT/'pack_models_b.json').read_text(encoding='utf-8'))
selection={
 'R1': [('長條主樓',['長條主樓']),('中央直條',['中央直條'])],
 'R2': [('中央塔身',['中央塔身']),('左右側翼',['左翼','右翼']),('前後側翼',['前翼','後翼'])],
 'R3': [('中央高樓',['中央高樓']),('中層樓',['左中樓','右中樓']),('外側低樓',['左外樓','右外樓'])],
 'R4': [('左右側翼',['左翼','右翼']),('中央連接部',['中央連接部'])],
 'R5': [('平台',['平台']),('住宅塔',['左塔','右塔']),('高位連橋',['高位連橋'])],
 'M1': [('商舖基座',['商舖基座']),('上層住宅',['上層住宅'])],
 'M2': [('商場基座',['商場基座']),('住宅塔',['左住宅塔','右住宅塔'])],
 'M3': [('街角商舖',['街角商舖']),('高住宅塔',['高住宅塔']),('低住宅塔',['低住宅塔'])],
 'C1': [('主塔',['主塔']),('側塔',['側塔'])],
 'C2': [('商場',['商場']),('主塔',['主塔']),('右側翼',['右側翼'])],
 'C3': [('下層塔身',['下層塔身']),('中層塔身',['中層塔身']),('上層塔身',['上層塔身'])],
 'C4': [('基座大樓',['基座大樓']),('左塔',['左塔']),('右塔',['右塔'])],
 'S1': [('教學樓',['教學樓']),('樓梯塔',['樓梯塔']),('屋頂',['屋頂'])],
 'S2': [('後翼',['後翼']),('左翼',['左翼']),('樓梯塔',['樓梯塔'])],
 'B1': [('升降機塔',['升降機塔']),('橋面',['橋面']),('橋墩',['橋墩一','橋墩二'])],
 'B2': [('升降機塔',['左塔','右塔']),('橋面',['橋面']),('中央橋墩',['中央橋墩'])],
}

def bounds(boxes):
    lo={k:min(p[k] for p in boxes) for k in ['x','y','z']}
    hi={k:max(p[k]+p[d] for p in boxes) for k,d in [('x','w'),('y','d'),('z','h')]}
    return {'w':hi['x']-lo['x'],'d':hi['y']-lo['y'],'h':hi['z']-lo['z']}

out=[]
for m in models:
    boxes=[p for p in m['boxes'] if p.get('role')!='window']
    base=next(p for p in boxes if p['role']=='base')
    main=[]
    for name,names in selection[m['id']]:
        ps=[p for p in boxes if p['name'] in names]
        assert len(ps)==len(names),(m['id'],names)
        assert all((p['w'],p['d'],p['h'])==(ps[0]['w'],ps[0]['d'],ps[0]['h']) for p in ps)
        p=ps[0]
        main.append({'name':name,**{k:p[k] for k in ['w','d','h']},'count':len(ps),'geometry_names':names})
    out.append({'id':m['id'],'title':m['title'],'overall':bounds(boxes),'base':{k:base[k] for k in ['w','d','h']},'main_parts':main})
(ROOT/'dimension_audit.json').write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding='utf-8')
for m in out:print(m['id'],m['overall'])
