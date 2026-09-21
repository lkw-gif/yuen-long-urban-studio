import type {Point} from './district-design';

// Frame the usable district, leaving A2 margins available by zooming out.
export function planFrame(width:number,height:number,zoom:number) {
  const aspect=Math.max(1,width)/Math.max(1,height);
  const baseWidth=Math.max(606,313*aspect);
  return {width:baseWidth/zoom,height:baseWidth/aspect/zoom};
}
export function zoomAt(center:Point,zoom:number,next:number,anchor:Point) {
  const limited=Math.min(6,Math.max(.5,next));
  return {zoom:limited,center:{x:anchor.x+(center.x-anchor.x)*zoom/limited,y:anchor.y+(center.y-anchor.y)*zoom/limited}};
}
