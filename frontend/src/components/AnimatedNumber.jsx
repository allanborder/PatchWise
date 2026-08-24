import { useEffect, useRef } from "react";
import { useMotionValue, useTransform, animate } from "framer-motion";

export default function AnimatedNumber({ value, duration = 0.6, decimals = 1 }) {
  const motionValue = useMotionValue(0);
  const ref = useRef(null);

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration,
      ease: "easeOut",
    });
    return controls.stop;
  }, [value, duration, motionValue]);

  useEffect(() => {
    return motionValue.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = latest.toFixed(decimals);
      }
    });
  }, [motionValue, decimals]);

  return <span ref={ref}>0{decimals > 0 ? "." + "0".repeat(decimals) : ""}</span>;
}