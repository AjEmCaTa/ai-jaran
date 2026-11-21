// Svaka nova stranica lagano uđe (kratko pojavljivanje), umjesto da naglo iskoči.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
