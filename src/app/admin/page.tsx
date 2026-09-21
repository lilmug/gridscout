"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  loadAssumptions,
  saveAssumptions,
} from "@/app/data/assumptionStorage";
import type { CableAssumption, RegionalQuotePart } from "@/app/data/assumptions";
import { defaultCableAssumptions, defaultRegionalQuoteParts } from "@/app/data/assumptions";

export default function AdminPage() {
  const [cables, setCables] = useState<CableAssumption[]>(defaultCableAssumptions);
  const [quoteParts, setQuoteParts] = useState<RegionalQuotePart[]>(defaultRegionalQuoteParts);
  const [saved, setSaved] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void loadAssumptions().then((assumptions) => {
      setCables(assumptions.cables);
      setQuoteParts(assumptions.quoteParts);
    });
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  function save() {
    void saveAssumptions({ cables, quoteParts })
      .then(() => {
        setSaved(true);
        window.setTimeout(() => setSaved(false), 2500);
      })
      .catch((error: unknown) => {
        console.error("Unable to save shared assumptions.", error);
      });
  }

  return (
    <main className="min-h-screen bg-[#f5f7f6] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
          <Link href="/" className="text-xl font-semibold tracking-tight text-emerald-950">GridScout</Link>
          <Link href="/" className="text-sm font-medium text-slate-600 hover:text-emerald-700">Back to portfolio</Link>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-6 py-10 lg:px-10">
        <p className="text-sm font-medium text-emerald-700">Administration</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">CAPEX assumptions</h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Configure les coûts des câbles moyenne tension par section et matériau,
          en coût rural. Le coût urbain est automatiquement calculé avec un
          coefficient de 1,5.
        </p>
        {saved && <p className="mt-5 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Assumptions saved for this session.</p>}

        <section className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-xl font-semibold">Câbles moyenne tension</h2>
            <p className="mt-1 text-sm text-slate-500">Coût estimé en €/km, selon la zone traversée.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-medium">Câble</th>
                  <th className="px-6 py-4 font-medium">Section</th>
                  <th className="px-6 py-4 font-medium">Coût rural (€/km)</th>
                  <th className="px-6 py-4 font-medium">Coût urbain calculé</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cables.map((cable) => (
                  <tr key={cable.id}>
                    <td className="px-6 py-3 font-medium">{cable.material}</td>
                    <td className="px-6 py-3 text-slate-600">{cable.sectionMm2} mm²</td>
                    <td className="px-6 py-3">
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={cable.ruralCostPerKm}
                        onChange={(event) => setCables((current) => current.map((item) => item.id === cable.id
                          ? { ...item, ruralCostPerKm: Number(event.target.value) }
                          : item))}
                        className="form-input mt-0 max-w-48"
                        aria-label={`${cable.label} rural`}
                      />
                    </td>
                    <td className="px-6 py-3 text-slate-600">
                      {(cable.ruralCostPerKm * 1.5).toLocaleString("fr-FR")} €/km
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Regional S3REnR quote-parts</h2>
          <p className="mt-1 text-sm text-slate-500">Valeur régionale en €/MW.</p>
          <div className="mt-5 grid gap-x-8 gap-y-4 md:grid-cols-2">
            {quoteParts.map((item) => (
              <label key={item.region} className="text-sm font-medium text-slate-700">
                {item.region}
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={item.quotePartPerMw}
                  onChange={(event) => setQuoteParts((current) => current.map((part) => part.region === item.region
                    ? { ...part, quotePartPerMw: Number(event.target.value) }
                    : part))}
                  className="form-input"
                />
              </label>
            ))}
          </div>
        </section>
        <button type="button" onClick={save} className="mt-8 rounded-lg bg-emerald-800 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700">Save assumptions</button>
      </div>
    </main>
  );
}
