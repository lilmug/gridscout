"use client";

import Link from "next/link";
import { useState } from "react";
import { CABLE_ASSUMPTIONS_KEY, QUOTE_PARTS_KEY, loadAssumptions } from "@/app/data/assumptionStorage";

export default function AdminPage() {
  const assumptions = loadAssumptions();
  const [cables, setCables] = useState(assumptions.cables);
  const [quoteParts, setQuoteParts] = useState(assumptions.quoteParts);
  const [saved, setSaved] = useState(false);

  function save() {
    window.localStorage.setItem(CABLE_ASSUMPTIONS_KEY, JSON.stringify(cables));
    window.localStorage.setItem(QUOTE_PARTS_KEY, JSON.stringify(quoteParts));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  }

  return (
    <main className="min-h-screen bg-[#f5f7f6] text-slate-950">
      <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10"><Link href="/" className="text-xl font-semibold tracking-tight text-emerald-950">GridScout</Link><Link href="/" className="text-sm font-medium text-slate-600 hover:text-emerald-700">Back to portfolio</Link></div></header>
      <div className="mx-auto max-w-5xl px-6 py-10 lg:px-10">
        <p className="text-sm font-medium text-emerald-700">Administration</p><h1 className="mt-2 text-4xl font-semibold tracking-tight">CAPEX assumptions</h1><p className="mt-3 max-w-2xl text-slate-600">Maintain the assumptions used by project scenarios. Values are currently stored in this browser until a database is connected.</p>
        {saved && <p className="mt-5 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Assumptions saved for this session.</p>}
        <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-semibold">Cable costs</h2><p className="mt-1 text-sm text-slate-500">Estimated connection cable cost by technology.</p><div className="mt-5 space-y-4">{cables.map((cable) => <label key={cable.id} className="flex flex-col gap-2 text-sm font-medium text-slate-700 sm:flex-row sm:items-center sm:justify-between"><span>{cable.label}</span><span className="flex items-center gap-2"><input type="number" min="0" step="1000" value={cable.costPerKm} onChange={(event) => setCables((current) => current.map((item) => item.id === cable.id ? { ...item, costPerKm: Number(event.target.value) } : item))} className="form-input mt-0 w-full sm:w-44" /><span className="font-normal text-slate-500">€/km</span></span></label>)}</div></section>
        <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-semibold">Regional S3REnR quote-parts</h2><p className="mt-1 text-sm text-slate-500">Enter the current regional value in €/MW. Zero means it still needs to be configured.</p><div className="mt-5 grid gap-x-8 gap-y-4 md:grid-cols-2">{quoteParts.map((item) => <label key={item.region} className="text-sm font-medium text-slate-700">{item.region}<span className="mt-2 flex items-center gap-2"><input type="number" min="0" step="1000" value={item.quotePartPerMw} onChange={(event) => setQuoteParts((current) => current.map((part) => part.region === item.region ? { ...part, quotePartPerMw: Number(event.target.value) } : part))} className="form-input mt-0" /><span className="font-normal text-slate-500">€/MW</span></span></label>)}</div></section>
        <button type="button" onClick={save} className="mt-8 rounded-lg bg-emerald-800 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700">Save assumptions</button>
      </div>
    </main>
  );
}
