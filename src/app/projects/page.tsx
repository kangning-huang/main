import type { Metadata } from "next";
import Link from "next/link";
import { PROJECTS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Research tools, interactive visualizations, and web applications by Kangning (Ken) Huang.",
};

export default function ProjectsPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12 lg:px-8">
      <h1 className="font-display text-4xl text-ink">Projects</h1>
      <p className="mt-2 text-ink-muted">
        Research tools, interactive visualizations, and web applications.
      </p>

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {PROJECTS.map((project) => {
          const isInternal = !!project.internalPath;

          return isInternal ? (
            <Link
              key={project.title}
              href={project.internalPath!}
              className="card-hover group flex flex-col rounded-xl border border-rule bg-paper p-6"
            >
              <CardContent project={project} />
            </Link>
          ) : (
            <a
              key={project.title}
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="card-hover group flex flex-col rounded-xl border border-rule bg-paper p-6"
            >
              <CardContent project={project} />
            </a>
          );
        })}
      </div>
    </div>
  );
}

function CardContent({ project }: { project: (typeof PROJECTS)[number] }) {
  return (
    <>
      <div className="flex items-start justify-between">
        <h2 className="font-display text-xl text-ink transition-colors group-hover:text-ember">
          {project.title}
        </h2>
        <span className="ml-2 text-ink-faint transition-colors group-hover:text-ember">
          &#8599;
        </span>
      </div>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-muted">
        {project.description}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {project.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-ember/20 bg-ember-light px-3 py-0.5 text-xs font-medium text-ember-dark"
          >
            {tag}
          </span>
        ))}
      </div>
    </>
  );
}
