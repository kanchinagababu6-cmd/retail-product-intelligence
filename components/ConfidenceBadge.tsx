export default function ConfidenceBadge({ score }: { score: number }) {
  return (
    <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
      {score}%
    </span>
  );
}