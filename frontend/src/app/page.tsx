export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 gap-6 bg-white text-black dark:bg-black dark:text-white">
      <h1 className="text-4xl font-bold tracking-tight">planu.mn</h1>
      <p className="text-lg text-center max-w-md">
        A graduation planning tool built for UMN students. Plan your courses, stay on track, and graduate with clarity.
      </p>
      <a
        href="#planner"
        className="mt-4 px-6 py-3 bg-[#7A0019] text-white rounded-full hover:bg-[#5c0014] transition-colors"
      >
        Get Started
      </a>
    </div>
  );
}
