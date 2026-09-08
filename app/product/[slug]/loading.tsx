export default function ProductLoading() {
  return (
    <div className="animate-pulse md:grid md:grid-cols-[1.15fr_0.85fr] md:gap-6">
      <div className="aspect-video bg-[#efe6d6] md:rounded-2xl" />
      <div className="space-y-3 bg-white px-4 py-5 md:rounded-2xl">
        <div className="h-7 w-24 rounded bg-[#f3ead8]" />
        <div className="h-6 w-3/4 rounded bg-[#f3ead8]" />
        <div className="h-4 w-1/2 rounded bg-[#f7f1e4]" />
        <div className="mt-6 h-11 w-full rounded-lg bg-[#f3ead8]" />
      </div>
    </div>
  );
}
