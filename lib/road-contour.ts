type Point = [number, number];

// Offset adjacent straight road segments and intersect them for closed, flush mitered corners.
// Positive distance is inward for the counter-clockwise contours in model-data.
export function insetContour(points:Point[],distance:number):Point[] {
 const cross=(a:Point,b:Point)=>a[0]*b[1]-a[1]*b[0];
 const subtract=(a:Point,b:Point):Point=>[a[0]-b[0],a[1]-b[1]];
 return points.map((p,i)=>{
  const before=subtract(p,points[(i+points.length-1)%points.length]);
  const after=subtract(points[(i+1)%points.length],p);
  const shift=(direction:Point):Point=>{const length=Math.hypot(...direction);return[p[0]-direction[1]/length*distance,p[1]+direction[0]/length*distance];};
  const a=shift(before),b=shift(after),det=cross(before,after);
  if(Math.abs(det)<1e-8)return b;
  const t=cross(subtract(b,a),after)/det;
  return[a[0]+before[0]*t,a[1]+before[1]*t];
 });
}
