// src/components/AdminAccessBlock.jsx
export default function AdminAccessBlock({ title="Restricted", note="Admins cannot access this area." }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 text-red-800 p-4">
      <h3 className="font-bold m-0">{title}</h3>
      <p className="m-0 mt-1 text-sm">{note}</p>
    </div>
  );
}
