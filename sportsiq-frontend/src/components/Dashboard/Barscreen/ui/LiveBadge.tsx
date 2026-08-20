export function LiveBadge({ label = "LIVE" }: { label?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative w-3.5 h-3.5">
        <div className="absolute inset-0 rounded-full bg-green-500 animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite]" />
        <div className="absolute inset-0 rounded-full bg-green-500" />
      </div>
      <span className="text-green-500 text-[22px] font-extrabold tracking-[2px] font-['Lexend']">{label}</span>
    </div>
  );
}
