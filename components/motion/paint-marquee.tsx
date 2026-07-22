export function PaintMarquee({ warm = false }: { warm?: boolean }) {
  const phrase = "INTERIORS  /  EXTERIORS  /  CABINETRY  /  COLOR  /  CRAFT  /  ";
  return <div className={`paint-marquee${warm ? " paint-marquee--warm" : ""}`} aria-hidden="true"><div><span>{phrase}</span><span>{phrase}</span><span>{phrase}</span></div></div>;
}
