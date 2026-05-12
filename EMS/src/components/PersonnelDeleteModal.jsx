import React from "react";

const PersonnelDeleteModal = ({ isOpen, onClose, onConfirm, employeeName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease]"
        onClick={onClose}
      ></div>
      <div className="relative z-[1000] w-full max-w-[460px] bg-surface border border-border-subtle rounded-[24px] shadow-2xl animate-[slideIn_0.2s_ease] transition-colors duration-300">
        <div className="p-8">
          <h2 className="text-text-main text-[24px] mb-3 font-extrabold tracking-tight">
            Confirm Delete
          </h2>
          <p className="text-text-muted text-[15px] leading-relaxed m-0">
            Are you sure you want to delete <span className="font-bold text-text-main">{employeeName}</span>? This action
            cannot be undone.
          </p>
          <div className="flex justify-end gap-3 mt-8">
            <button
              onClick={onClose}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-surface-alt text-text-muted border border-border-subtle rounded-[12px] cursor-pointer text-[14px] font-semibold transition-all duration-200 shadow-sm hover:bg-surface-hover hover:text-text-main group"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white border border-red-700 rounded-[12px] cursor-pointer text-[14px] font-semibold transition-all duration-200 shadow-sm hover:bg-red-500 hover:-translate-y-0.5 group"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonnelDeleteModal;
