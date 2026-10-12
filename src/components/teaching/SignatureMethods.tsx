import T from "@/components/T";
import { SIGNATURE_METHODS } from "@/lib/teaching";

export default function SignatureMethods() {
  return (
    <ol className="mt-6 grid gap-x-10 gap-y-6 md:grid-cols-2">
      {SIGNATURE_METHODS.map((m, i) => (
        <li key={m.title.en} className="flex gap-4">
          <span
            aria-hidden="true"
            className="font-display text-2xl leading-none text-ember/70 tabular-nums"
          >
            {String(i + 1).padStart(2, "0")}
          </span>
          <div>
            <h3 className="font-display text-lg text-ink">
              <T en={m.title.en} zh={m.title.zh} />
            </h3>
            {m.courses ? (
              <p className="mt-0.5 text-xs tracking-wide text-ink-faint">
                <T en={m.courses.en} zh={m.courses.zh} />
              </p>
            ) : null}
            <p className="mt-1 text-sm leading-relaxed text-ink-muted">
              <T en={m.body.en} zh={m.body.zh} />
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
