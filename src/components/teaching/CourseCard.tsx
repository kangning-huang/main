import T from "@/components/T";
import type { Course } from "@/lib/teaching";

export default function CourseCard({ course }: { course: Course }) {
  return (
    <article
      id={course.code.toLowerCase().replace(/\s+/g, "-")}
      className="flex scroll-mt-24 flex-col rounded-xl border border-rule bg-paper p-6"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-ember-light px-2.5 py-0.5 font-mono text-xs font-semibold text-ember-dark">
          {course.code}
        </span>
        {course.tag && (
          <span className="rounded-full border border-teal/30 bg-teal-light px-2.5 py-0.5 text-xs font-medium text-teal">
            <T en={course.tag.en} zh={course.tag.zh} />
          </span>
        )}
      </div>

      <h3 className="mt-4 font-display text-xl leading-snug text-ink">
        <T en={course.title} zh={course.titleZh ?? course.title} />
      </h3>
      <p className="mt-1 text-xs uppercase tracking-wider text-ink-faint">
        <T en={course.terms.en} zh={course.terms.zh} />
      </p>

      <p className="mt-4 text-sm leading-relaxed text-ink-muted">
        <T en={course.summary.en} zh={course.summary.zh} />
      </p>

      <ul className="mt-4 space-y-1.5 text-sm leading-relaxed text-ink-muted">
        {course.highlights.map((h) => (
          <li key={h.en} className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ember" />
            <T en={h.en} zh={h.zh} />
          </li>
        ))}
      </ul>

      {(course.recognition || course.syllabusUrl) && (
        <div className="mt-auto pt-5">
          {course.recognition && (
            <p className="text-xs font-medium text-teal">
              ★ <T en={course.recognition.en} zh={course.recognition.zh} />
            </p>
          )}
          {course.syllabusUrl && (
            <a
              href={course.syllabusUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="link-underline mt-2 inline-block text-sm font-medium text-ember"
            >
              <T en="Public syllabus" zh="公开课程大纲" />
              <span className="ml-1 text-[10px] opacity-60">&#8599;</span>
            </a>
          )}
        </div>
      )}
    </article>
  );
}
