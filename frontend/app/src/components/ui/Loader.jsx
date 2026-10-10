export default function Loader({ text = 'جاري التحميل...' }) {
  return (
    <div className="grid place-items-center py-20 text-slate-500">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
      <p className="mt-3 text-sm font-bold">{text}</p>
    </div>
  );
}
export const Empty = ({ icon = '📭', title, text }) => (
  <div className="card grid place-items-center px-4 py-14 text-center">
    <div className="text-4xl">{icon}</div>
    <h3 className="mt-2 font-extrabold">{title}</h3>
    {text && <p className="mt-1 text-sm text-slate-500">{text}</p>}
  </div>
);