export interface TransparentCardProps {
  className?: string;
  children: React.ReactNode;
}

export default function TransparentCard({
  className = "",
  children,
}: TransparentCardProps) {
  return (
    <div
      className={`p-[12px] rounded-[4px] bg-[#FFFFFF1A] gap-[12px] ${className}`}
    >
      {children}
    </div>
  );
}
