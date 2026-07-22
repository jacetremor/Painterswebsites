import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/lib/types";

export function ProjectCard({ project }: { project: Project }) {
  const image = project.images.find((item) => item.stage === "after") ?? project.images[0];
  return (
    <article className="card">
      <Link className="card-link" href={`/projects/${project.slug}`}>
        {image ? <div className="card-image"><Image src={image.src} alt={image.alt} fill sizes="(max-width: 620px) 100vw, (max-width: 1000px) 50vw, 33vw" /></div> : null}
        <div className="card__body"><span className="pill">{project.category}</span><h3>{project.name}</h3><p>{project.intro}</p><strong>View project details</strong></div>
      </Link>
    </article>
  );
}
