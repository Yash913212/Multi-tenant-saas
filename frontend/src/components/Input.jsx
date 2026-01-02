const Input = ({ label, type = "text", name, value, onChange, placeholder, required = false }) => {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-vite-muted mb-1">
          {label}
        </label>
      )}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full px-3 py-2 bg-white border border-vite-border rounded-md text-vite-text placeholder:text-vite-muted focus:outline-none focus:ring-2 focus:ring-[var(--vite-primary)] focus:border-[var(--vite-primary)]"
      />
    </div>
  );
};

export default Input;