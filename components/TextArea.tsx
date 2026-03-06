type Props = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
};

export default function TextArea({ label, value, onChange, placeholder }: Props) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <textarea
        className="min-h-44 w-full rounded-xl border border-gray-300 p-3 text-sm shadow-sm outline-none focus:border-gray-900"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
