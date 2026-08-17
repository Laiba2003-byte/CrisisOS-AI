function StatCard({ label, value, detail, icon: Icon, tone }) {
  return (
    <section className={`rounded-lg border p-5 ${tone}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-300">{label}</p>
          <div className="mt-3 text-3xl font-semibold text-white">{value}</div>
          <p className="mt-2 text-sm text-slate-400">{detail}</p>
        </div>
        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-black/20">
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </section>
  );
}

export default StatCard;