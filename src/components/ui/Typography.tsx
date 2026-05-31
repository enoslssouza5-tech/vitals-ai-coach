import React from "react";

export const SectionTitle = React.memo(function SectionTitle({
  title,
  action,
  icon,
}: {
  title: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex items-center justify-between gap-4">
      <div className="min-w-0 flex items-center gap-3 text-base font-semibold text-white">
        {icon}
        <span className="truncate">{title}</span>
      </div>
      {action && <div className="shrink-0 text-sm font-semibold text-[#C8FF00]">{action}</div>}
    </div>
  );
});

export const SimpleMetric = React.memo(function SimpleMetric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#0A0A0A] p-4">
      <div className="text-[#C8FF00]">{icon}</div>
      <div className="mt-5 text-2xl font-black text-white">{value}</div>
      <div className="mt-1 text-sm text-[#888888]">{label}</div>
    </div>
  );
});
