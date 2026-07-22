export const NotFoundPage = () => {
  return (
    <div className="w-full h-full bg-gradient-to-br from-[#130f25] via-[#291757] to-[#0a0718] flex flex-col items-center justify-center relative">
      <div className="absolute inset-0 pointer-events-none select-none flex items-center justify-center animate-pulse">
        <div className="flex gap-4 opacity-60">
          <div className="w-16 h-16 rounded-full bg-blue-500 shadow-lg blur-md" />
          <div className="w-24 h-24 rounded-full bg-pink-600 shadow-lg blur-lg" />
          <div className="w-20 h-20 rounded-full bg-yellow-400 shadow-lg blur-md" />
          <div className="w-28 h-28 rounded-full bg-green-500 shadow-xl blur-lg" />
        </div>
      </div>
      <div className="z-10 bg-white/5 rounded-3xl border border-white/10 p-10 flex flex-col items-center shadow-2xl gap-6 mt-[-5vh]">
        <span className="bg-gradient-to-r from-fuchsia-500 via-blue-400 to-yellow-400 bg-clip-text text-transparent text-7xl font-extrabold tracking-widest drop-shadow-lg select-none animate-bounce duration-1000">
          404
        </span>
        <span className="text-white text-3xl font-bold tracking-wide uppercase drop-shadow-lg">
          Page Not Found
        </span>
        <span className="text-white text-lg font-medium text-center max-w-md opacity-80">
          The page you're looking for does not exist.
        </span>
        <span className="text-white text-base font-normal opacity-70 text-center max-w-xs">
          Double-check the URL or go to login to access your account
          <span role="img" aria-label="sparkles">
            {" "}
            ✨
          </span>
        </span>
        <a
          href="/signin"
          className="mt-4 bg-gradient-to-br from-blue-500 to-fuchsia-500 hover:from-fuchsia-500 hover:to-yellow-400 transition-colors duration-300 text-white text-xl font-bold px-8 py-3 rounded-xl shadow-md focus:outline-none outline-none border-none hover:scale-105"
        >
          Go to Login
        </a>
      </div>
    </div>
  );
};
