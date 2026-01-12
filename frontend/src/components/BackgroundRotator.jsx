import { useEffect, useMemo, useRef, useState } from "react";

export default function BackgroundRotator({
  intervalMs = 9000,
  fadeMs = 2200,
}) {
  const images = useMemo(
    () => ["/bg/bg1.png", "/bg/bg2.png", "/bg/bg3.png", "/bg/bg4.png"],
    []
  );

  const len = images.length;

  const [idxA, setIdxA] = useState(0);
  const [idxB, setIdxB] = useState(len > 1 ? 1 : 0);
  const [showA, setShowA] = useState(true);

  const showARef = useRef(true);
  const activeRef = useRef(0);

  useEffect(() => {
    setIdxA(0);
    setIdxB(len > 1 ? 1 : 0);
    setShowA(true);
    showARef.current = true;
    activeRef.current = 0;
  }, [len]);

  const layerStyle = { transitionDuration: `${fadeMs}ms` };

  useEffect(() => {
    if (len <= 1) return;

    const id = setInterval(() => {
      const next = (activeRef.current + 1) % len;

      if (showARef.current) {
        setIdxB(next);
        setShowA(false);
      } else {
        setIdxA(next);
        setShowA(true);
      }

      activeRef.current = next;
      showARef.current = !showARef.current;
    }, intervalMs);

    return () => clearInterval(id);
  }, [len, intervalMs]);

  return (
    <div className="app-bg" aria-hidden="true">
      <div
        className={`app-bg-layer ${showA ? "is-visible" : ""}`}
        style={{ ...layerStyle, backgroundImage: `url(${images[idxA]})` }}
      />
      <div
        className={`app-bg-layer ${!showA ? "is-visible" : ""}`}
        style={{ ...layerStyle, backgroundImage: `url(${images[idxB]})` }}
      />
    </div>
  );
}
