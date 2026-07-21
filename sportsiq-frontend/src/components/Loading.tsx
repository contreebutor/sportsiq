interface Props {
  isLight?: boolean;
  size?: string;
}
export default function Loading({ isLight = true, size = "h-12 w-12" }: Props) {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <span
        className={`animate-spin rounded-full ${size} border-t-2 border-b-2 ${
          isLight ? "border-white" : "border-black"
        }`}
      />
    </div>
  );
}
