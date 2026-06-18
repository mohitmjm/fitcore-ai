import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6 gap-4">
      <p className="text-xs uppercase tracking-widest text-cyan-400 font-bold">404</p>
      <h1 className="text-3xl font-black text-white">This page took a rest day.</h1>
      <p className="text-gray-400 max-w-sm">
        We couldn&apos;t find what you were looking for. Let&apos;s get you back on track.
      </p>
      <div className="flex gap-3 pt-1">
        <Link
          href="/today"
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold hover:scale-[1.02] transition-transform"
        >
          Go to Today
        </Link>
        <Link href="/" className="px-5 py-2.5 rounded-xl border border-white/15 text-gray-200 font-bold hover:border-white/30 transition-colors">
          Home
        </Link>
      </div>
    </div>
  );
}
