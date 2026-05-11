import React, { useState, useEffect, useRef } from "react";

const SearchableSelect = ({ options, value, onChange, placeholder = "Select an option..." }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const selectedOption = options.find(opt => opt.id === value);

  const filteredOptions = options.filter(opt => {
    const search = searchTerm.toLowerCase();
    const fullName = `${opt.last_name}, ${opt.first_name} ${opt.middle_name || ""}`.toLowerCase();
    const employeeNo = opt.employee_no?.toLowerCase() || "";
    return fullName.includes(search) || employeeNo.includes(search);
  });

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
    if (!isOpen) {
      setSearchTerm("");
      setHighlightedIndex(-1);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === "ArrowDown") {
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : prev));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          handleSelect(filteredOptions[highlightedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  const handleSelect = (option) => {
    onChange({ target: { name: "employee_id", value: option.id } });
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Display / Toggle */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        tabIndex="0"
        className={`w-full bg-surface border border-border-subtle rounded-xl px-4 py-2.5 flex items-center justify-between cursor-pointer transition-all hover:border-accent/50 ${isOpen ? "ring-4 ring-accent/10 border-accent" : ""}`}
      >
        <span className={`text-[13px] font-medium truncate ${selectedOption ? "text-text-main" : "text-text-placeholder"}`}>
          {selectedOption 
            ? `${selectedOption.last_name}, ${selectedOption.first_name} ${selectedOption.middle_name || ""} (${selectedOption.employee_no})` 
            : placeholder}
        </span>
        <i className={`fas fa-chevron-down text-[12px] text-text-placeholder transition-transform duration-200 ${isOpen ? "rotate-180 text-accent" : ""}`}></i>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-2 bg-surface border border-border-subtle rounded-2xl shadow-2xl z-[100] flex flex-col overflow-hidden animate-[slideUp_0.2s_ease-out]">
          {/* Search Input */}
          <div className="p-3 border-b border-border-subtle bg-surface-alt/50">
            <div className="relative flex items-center">
              <i className="fas fa-search absolute left-3 text-text-placeholder text-[12px]"></i>
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setHighlightedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search name or ID..."
                className="w-full bg-surface border border-border-subtle rounded-lg pl-9 pr-4 py-2 text-[13px] font-medium outline-none focus:border-accent transition-all"
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-[240px] overflow-y-auto custom-scrollbar p-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, i) => (
                <div
                  key={opt.id}
                  onClick={() => handleSelect(opt)}
                  onMouseEnter={() => setHighlightedIndex(i)}
                  className={`px-4 py-2.5 rounded-lg cursor-pointer flex flex-col gap-0.5 transition-colors ${i === highlightedIndex || value === opt.id ? "bg-accent/10" : "hover:bg-surface-alt"}`}
                >
                  <span className={`text-[13px] font-bold ${value === opt.id ? "text-accent" : "text-text-main"}`}>
                    {opt.last_name}, {opt.first_name} {opt.middle_name || ""}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black text-text-placeholder uppercase tracking-widest">{opt.employee_no}</span>
                    <span className="text-[11px] text-text-placeholder opacity-50">•</span>
                    <span className="text-[11px] font-medium text-text-placeholder truncate">{opt.department || "No Department"}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center flex flex-col items-center gap-2 opacity-50">
                <i className="fas fa-search text-[24px]"></i>
                <p className="text-[12px] font-bold uppercase tracking-widest">No matching employees</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
