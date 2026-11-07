import T from "@/components/T";
import { COLLABORATORS, SPONSORS } from "@/lib/partners";

function OrgLogo({
  src,
  wide,
}: {
  src: string;
  wide?: boolean;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={wide ? 96 : 40}
      height={wide ? 24 : 40}
      loading="lazy"
      decoding="async"
      className={wide ? "h-6 w-24 object-contain" : "h-9 w-9 object-contain"}
    />
  );
}

export default function CollaboratorsSponsors() {
  return (
    <section
      className="border-t border-rule-faint py-16 md:py-20"
      aria-labelledby="collaborators-heading"
    >
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <h2 id="collaborators-heading" className="section-heading">
          <T en="Collaborators" zh="合作者" />
        </h2>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {COLLABORATORS.map((c) => (
            <li key={c.href}>
              <a
                href={c.href}
                target="_blank"
                rel="noopener noreferrer"
                className="card-hover group flex items-center gap-3 rounded-lg border border-rule bg-paper px-3 py-3"
              >
                <span
                  className={
                    c.wideLogo
                      ? "flex h-11 w-28 shrink-0 items-center justify-center rounded-md bg-paper-warm px-2 py-1.5"
                      : "flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-paper-warm p-1.5"
                  }
                >
                  <OrgLogo src={c.logo} wide={c.wideLogo} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[15px] font-medium leading-snug text-ink transition-colors group-hover:text-ember">
                    <T en={c.name} zh={c.nameZh ?? c.name} />
                    <span className="ml-1 text-[10px] opacity-40">&#8599;</span>
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-ink-faint">
                    <T en={c.org} zh={c.orgZh ?? c.org} />
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>

        <h2
          id="sponsors-heading"
          className="section-heading mt-16 md:mt-20"
        >
          <T en="Sponsors" zh="资助方" />
        </h2>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SPONSORS.map((s) => (
            <li key={s.href + s.name}>
              <a
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="card-hover group flex items-center gap-3 rounded-lg border border-rule bg-paper px-3 py-3"
              >
                <span
                  className={
                    s.wideLogo
                      ? "flex h-11 w-28 shrink-0 items-center justify-center rounded-md bg-paper-warm px-2 py-1.5"
                      : "flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-paper-warm p-1.5"
                  }
                >
                  <OrgLogo src={s.logo} wide={s.wideLogo} />
                </span>
                <span className="min-w-0 text-[15px] font-medium leading-snug text-ink transition-colors group-hover:text-ember">
                  <T en={s.name} zh={s.nameZh ?? s.name} />
                  <span className="ml-1 text-[10px] opacity-40">&#8599;</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
