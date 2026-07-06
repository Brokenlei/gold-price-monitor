export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-12 h-12 border-4 border-slate-600 border-t-green-500 rounded-full animate-spin"></div>
    </div>
  );
}