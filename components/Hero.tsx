import Button from "./ui/Button";

export default function Hero() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0B0B0B] px-6">

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#2563eb20,transparent_65%)]" />

      <div className="relative z-10 max-w-5xl text-center">

        <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-5 py-2 text-sm font-medium text-blue-400">
          🚀 Nova generacija AI agenata
        </span>

        <h1 className="mt-8 text-7xl font-black tracking-tight text-white md:text-8xl">
          AI <span className="text-blue-500">JARAN</span>
        </h1>

        <p className="mx-auto mt-8 max-w-3xl text-xl leading-9 text-gray-400">
          Digitalni pomoćnik koji razgovara, razmišlja i obavlja zadatke
          umjesto tebe.
        </p>

        <div className="mt-12 flex flex-wrap justify-center gap-5">

          <Button>
            Probaj besplatno
          </Button>

          <Button variant="secondary">
            Pogledaj demo
          </Button>

        </div>

      </div>

    </section>
  );
}