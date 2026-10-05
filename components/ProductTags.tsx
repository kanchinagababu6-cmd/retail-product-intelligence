export default function ProductTags({ tags }: { tags: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-sm">
          {tag}
        </span>
      ))}
    </div>
  );
}