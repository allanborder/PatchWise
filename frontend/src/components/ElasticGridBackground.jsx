import { useRef, useEffect } from "react";

/**
 * ElasticGridBackground
 *
 * Full-screen dark canvas with a grid of nodes connected by lines.
 * Nodes are repelled by the cursor within a magnetic radius, then
 * spring back to their resting position via simple Hooke's-law physics.
 *
 * Usage:
 *   <ElasticGridBackground />
 *   <ElasticGridBackground spacing={48} radius={160} strength={0.35} />
 */
export default function ElasticGridBackground({
  spacing = 56, // px between resting grid nodes
  radius = 140, // px, mouse influence radius
  strength = 0.28, // repulsion force multiplier
  stiffness = 0.08, // spring constant pulling nodes back home
  damping = 0.82, // velocity damping per frame (0-1, lower = more damped)
  lineColor = "rgba(231, 210, 188, 0.16)", // #e7d2bc at low opacity
  diagonalColor = "rgba(231, 210, 188, 0.07)", // fainter cross-bracing
  backgroundColor = "#452615",
  className = "",
}) {
  const canvasRef = useRef(null);
  const nodesRef = useRef([]);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const rafRef = useRef(null);
  const dimsRef = useRef({ width: 0, height: 0, cols: 0, rows: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    function buildGrid(width, height) {
      const cols = Math.ceil(width / spacing) + 2;
      const rows = Math.ceil(height / spacing) + 2;
      const nodes = [];

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const homeX = x * spacing;
          const homeY = y * spacing;
          nodes.push({
            homeX,
            homeY,
            x: homeX,
            y: homeY,
            vx: 0,
            vy: 0,
          });
        }
      }

      dimsRef.current = { width, height, cols, rows };
      nodesRef.current = nodes;
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = window.innerWidth;
      const height = window.innerHeight;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      buildGrid(width, height);
    }

    function handlePointerMove(e) {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
    }

    function handlePointerLeave() {
      mouseRef.current.x = -9999;
      mouseRef.current.y = -9999;
    }

    function step() {
      const { width, height, cols, rows } = dimsRef.current;
      const nodes = nodesRef.current;
      const mouse = mouseRef.current;

      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);

      // physics update: spring toward home + repulsion from cursor
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];

        // spring force back to resting position
        const dxHome = n.homeX - n.x;
        const dyHome = n.homeY - n.y;
        n.vx += dxHome * stiffness;
        n.vy += dyHome * stiffness;

        // repulsion from mouse
        const dxMouse = n.x - mouse.x;
        const dyMouse = n.y - mouse.y;
        const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);

        if (distMouse < radius && distMouse > 0.001) {
          const falloff = 1 - distMouse / radius; // 1 at center, 0 at edge
          const force = falloff * falloff * strength * radius;
          n.vx += (dxMouse / distMouse) * force * 0.05;
          n.vy += (dyMouse / distMouse) * force * 0.05;
        }

        // damping + integrate
        n.vx *= damping;
        n.vy *= damping;
        n.x += n.vx;
        n.y += n.vy;
      }

      // draw grid lines: structural (horizontal/vertical) + diagonal bracing
      // the diagonals are what make each cell actually read as a spring/truss
      // instead of a floppy net when nodes get displaced
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 1;
      ctx.beginPath();

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const idx = y * cols + x;
          const n = nodes[idx];

          // connect to right neighbor
          if (x < cols - 1) {
            const right = nodes[idx + 1];
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(right.x, right.y);
          }

          // connect to bottom neighbor
          if (y < rows - 1) {
            const bottom = nodes[idx + cols];
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(bottom.x, bottom.y);
          }
        }
      }

      ctx.stroke();

      // diagonal bracing, drawn slightly fainter so it reads as structure
      // rather than doubling the density of the main grid
      ctx.strokeStyle = diagonalColor;
      ctx.beginPath();

      for (let y = 0; y < rows - 1; y++) {
        for (let x = 0; x < cols - 1; x++) {
          const idx = y * cols + x;
          const topLeft = nodes[idx];
          const topRight = nodes[idx + 1];
          const bottomLeft = nodes[idx + cols];
          const bottomRight = nodes[idx + cols + 1];

          ctx.moveTo(topLeft.x, topLeft.y);
          ctx.lineTo(bottomRight.x, bottomRight.y);

          ctx.moveTo(topRight.x, topRight.y);
          ctx.lineTo(bottomLeft.x, bottomLeft.y);
        }
      }

      ctx.stroke();

      rafRef.current = requestAnimationFrame(step);
    }

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("mouseleave", handlePointerLeave);
    canvas.addEventListener("touchmove", (e) => {
      if (e.touches[0]) {
        handlePointerMove(e.touches[0]);
      }
    });

    rafRef.current = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseleave", handlePointerLeave);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spacing, radius, strength, stiffness, damping, lineColor, diagonalColor, backgroundColor]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 h-screen w-screen ${className}`}
      aria-hidden="true"
    />
  );
}