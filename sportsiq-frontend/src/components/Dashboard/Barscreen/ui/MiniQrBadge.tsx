interface Props {
  qrDataUrl: string;
}

export function MiniQrBadge({ qrDataUrl }: Props) {
  return (
    <div className="fixed bottom-7 right-9 flex items-center gap-3.5 bg-[rgba(11,34,48,0.85)] border border-white/[0.07] rounded-[14px] px-[18px] py-2.5 backdrop-blur-[8px]">
      {qrDataUrl && (
        <img src={qrDataUrl} alt="Join" className="w-14 h-14 rounded-md" />
      )}
      {/* Room code — commented out for now
      <div>
        <div className="text-slate-500 text-[13px] font-['Lexend'] tracking-[1px]">JOIN</div>
        <div className="text-slate-50 text-[22px] font-black font-['Lexend'] tracking-[5px] tabular-nums">
          {roomCode}
        </div>
      </div>
      */}
    </div>
  );
}
