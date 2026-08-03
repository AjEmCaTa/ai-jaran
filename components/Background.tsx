export default function Background() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#030712]">

      {/* GRID */}
      <div
        className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:42px_42px]"
        style={{
          maskImage:
            "radial-gradient(circle at center,#000 45%,transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(circle at center,#000 45%,transparent 100%)",
        }}
      />

      {/* PLAVA KUGLA */}
      <div className="absolute left-[-150px] top-[5%] h-[700px] w-[700px] rounded-full bg-blue-500/20 blur-[180px]" />

      {/* LJUBIČASTA KUGLA */}
      <div className="absolute right-[-180px] top-[30%] h-[700px] w-[700px] rounded-full bg-purple-500/20 blur-[180px]" />

      {/* DODATNI PLAVI GLOW */}
      <div className="absolute left-1/2 top-[65%] h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[160px]" />

      {/* VINJETA */}
      <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_35%,#030712_100%)]" />

    </div>
  );
}