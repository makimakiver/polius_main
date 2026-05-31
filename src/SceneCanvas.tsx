import { useEffect, useRef } from "react";
import { PolliusScene } from "./scene3d";

// React wrapper around the framework-agnostic PolliusScene: creates the WebGL
// scene on mount and tears it down on unmount (handles StrictMode's double
// mount cleanly via destroy()).
export function SceneCanvas({ className }: { className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const scene = new PolliusScene(host);
    scene.start();
    return () => scene.destroy();
  }, []);

  return <div ref={hostRef} className={className} aria-label="3D Pollius world" />;
}
