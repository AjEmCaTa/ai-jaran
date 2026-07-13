export default function Background() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#090909]">
      <div className="absolute top-[-200px] left-[-150px] h-[500px] w-[500px] rounded-full bg-blue-600 opacity-20 blur-[150px]" />

      <div className="absolute bottom-[-250px] right-[-150px] h-[500px] w-[500px] rounded-full bg-cyan-500 opacity-20 blur-[180px]" />

      <div className="absolute top-1/2 left-1/2 h-[350px] w-[350px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500 opacity-10 blur-[120px]" />
    </div>
  );
}