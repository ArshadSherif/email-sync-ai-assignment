// components/utils/EmailSkeleton.tsx
export default function EmailSkeleton() {
  const items = Array.from({ length: 5 });

  return (
    <div className="animate-pulse divide-y divide-gray-100">
      {items.map((_, i) => (
        <div key={i} className="flex gap-4 py-4">
          <div className="h-10 w-10 rounded-full bg-gray-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-2/3 bg-gray-200 rounded" />
            <div className="h-3 w-5/6 bg-gray-100 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
