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
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-3xl font-bold text-foreground">Projects</h1>
      <p className="mt-2 text-foreground-secondary">
        Research tools, interactive visualizations, and web applications.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {PROJECTS.map((project) => {
          const isInternal = !!project.internalPath;

          return isInternal ? (
            <Link
              key={project.title}
              href={project.internalPath!}
              className="group flex flex-col rounded-lg border border-border p-6 hover:border-nyu-violet/30 transition-colors"
            >
              <CardContent project={project} />
            </Link>
          ) : (
            <a
              key={project.title}
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col rounded-lg border border-border p-6 hover:border-nyu-violet/30 transition-colors"
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
        <h2 className="text-lg font-semibold text-foreground group-hover:text-nyu-violet transition-colors">
          {project.title}
        </h2>
        <span className="ml-2 text-foreground-secondary group-hover:text-nyu-violet transition-colors">
          &#8599;
        </span>
      </div>
      <p className="mt-3 flex-1 text-sm text-foreground-secondary leading-relaxed">
        {project.description}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {project.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-nyu-violet-bg px-3 py-0.5 text-xs font-medium text-nyu-violet"
          >
            {tag}
          </span>
        ))}
      </div>
    </>
  );
}
