import { motion } from "framer-motion";
import { bmiCategoryColor, type BmiCategory } from "@/lib/health";

interface Props {
  bmi: number;
  category: BmiCategory;
}

export function BMIGauge({ bmi, category }: Props) {
  // Map BMI 10..40 to angle -90 .. 90
  const min = 10, max = 40;
  const clamped = Math.min(max, Math.max(min, bmi));
  const angle = ((clamped - min) / (max - min)) * 180 - 90;

  const size = 220;
  const stroke = 22;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = Math.PI * r; // half

  const arcs = [
    { from: 10, to: 18.5, color: "var(--chart-3)" },
    { from: 18.5, to: 25, color: "var(--chart-1)" },
    { from: 25, to: 30, color: "var(--chart-4)" },
    { from: 30, to: 40, color: "var(--destructive)" },
  ];

  function polar(angleDeg: number) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function arcPath(from: number, to: number) {
    const a1 = ((from - min) / (max - min)) * 180;
    const a2 = ((to - min) / (max - min)) * 180;
    const p1 = polar(a1);
    const p2 = polar(a2);
    const large = a2 - a1 > 180 ? 1 : 0;
    return `M ${p1.x} ${p1.y} A ${r} ${r} 0 ${large} 1 ${p2.x} ${p2.y}`;
  }

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size / 2 + 24} viewBox={`0 0 ${size} ${size / 2 + 24}`}>
        {arcs.map((a, i) => (
          <path
            key={i}
            d={arcPath(a.from, a.to)}
            stroke={a.color}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="butt"
            opacity={0.85}
          />
        ))}
        {/* Needle */}
        <motion.line
          x1={cx}
          y1={cy}
          x2={cx}
          y2={cy - r + 6}
          stroke="var(--foreground)"
          strokeWidth={3}
          strokeLinecap="round"
          style={{ transformOrigin: `${cx}px ${cy}px` }}
          initial={{ rotate: -90 }}
          animate={{ rotate: angle }}
          transition={{ type: "spring", stiffness: 70, damping: 14 }}
        />
        <circle cx={cx} cy={cy} r={8} fill="var(--foreground)" />
        <circle cx={cx} cy={cy} r={3} fill="var(--background)" />
      </svg>
      <div className="-mt-2 text-center">
        <div className="font-display text-5xl font-bold tracking-tight" style={{ color: bmiCategoryColor(category) }}>
          {bmi.toFixed(1)}
        </div>
        <div className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">{category}</div>
      </div>
    </div>
  );
}
