import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-vite-card border border-vite-border rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-vite-border">
          <h3 className="text-lg font-semibold text-vite-text">{title}</h3>
          <button 
            onClick={onClose}
            className="text-vite-muted hover:text-vite-text transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 text-vite-text">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;