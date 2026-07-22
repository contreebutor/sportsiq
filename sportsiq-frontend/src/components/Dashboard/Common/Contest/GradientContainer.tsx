interface Props {
  title: string;
  children: React.ReactNode;
}
const GradientContainer = ({ title, children }: Props) => {
  return (
    <>
      <div className="w-full h-full bg-gradient-to-b from-white/10 to-transparent flex flex-col items-center justify-center gap-3 pt-2 px-3 pb-3 rounded-sm">
        <span className="text-xl font-medium text-white">{title}</span>
        {children}
      </div>
    </>
  );
};

export default GradientContainer;
