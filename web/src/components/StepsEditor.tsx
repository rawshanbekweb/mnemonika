"use client";

import type { MnemonicStep } from "@/lib/admin-types";

/** Mnemonik bosqichlar (letter / en / uz) muharriri. */
export default function StepsEditor({
  steps,
  onChange,
}: {
  steps: MnemonicStep[];
  onChange: (s: MnemonicStep[]) => void;
}) {
  const update = (i: number, patch: Partial<MnemonicStep>) =>
    onChange(steps.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  const add = () => onChange([...steps, { letter: "", en: "", uz: "" }]);
  const remove = (i: number) => onChange(steps.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      {steps.map((s, i) => (
        <div key={i} className="flex gap-2">
          <input
            className="input w-14 text-center font-bold"
            value={s.letter}
            maxLength={2}
            placeholder="P"
            onChange={(e) => update(i, { letter: e.target.value })}
          />
          <input
            className="input flex-1"
            value={s.en}
            placeholder="Position"
            onChange={(e) => update(i, { en: e.target.value })}
          />
          <input
            className="input flex-1"
            value={s.uz}
            placeholder="Nuqtai nazar"
            onChange={(e) => update(i, { uz: e.target.value })}
          />
          <button type="button" className="btn-danger px-3" onClick={() => remove(i)}>
            ✕
          </button>
        </div>
      ))}
      <button type="button" className="btn-ghost" onClick={add}>
        ＋ Bosqich
      </button>
    </div>
  );
}
