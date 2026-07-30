type RulerProgressProps = {
  value: number;
};

/** Pencil-ruler progress bar: tick marks with a sienna fill and a marker dot. */
export function RulerProgress({ value }: RulerProgressProps) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="relative flex h-6 items-center">
      <div className="pointer-events-none absolute inset-0 flex justify-between px-0.5 opacity-20">
        {Array.from({ length: 11 }).map((_, i) => (
          <div
            key={i}
            className={
              i % 5 === 0 ? "w-px h-full bg-foreground" : "w-px h-2 mt-2 bg-foreground"
            }
          />
        ))}
      </div>
      <div className="absolute h-[2px] w-full bg-foreground/10" />
      <div
        className="absolute h-[2px] bg-accent transition-all duration-700 ease-out"
        style={{ width: `${pct}%` }}
      />
      <div
        className="absolute size-3 rounded-full bg-accent shadow-sm ring-4 ring-background transition-all duration-700 ease-out"
        style={{ left: `${pct}%`, transform: "translateX(-50%)" }}
      />
    </div>
  );
}
