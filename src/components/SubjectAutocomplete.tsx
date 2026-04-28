
"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { SUBJECTS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface SubjectAutocompleteProps {
  defaultValue?: string;
  onSelect: (value: string) => void;
  showAllOption?: boolean;
  placeholder?: string;
  className?: string;
}

export function SubjectAutocomplete({
  defaultValue,
  onSelect,
  showAllOption,
  placeholder = "Select subject...",
  className,
}: SubjectAutocompleteProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedLabel, setSelectedLabel] = React.useState(defaultValue || "");

  const options = React.useMemo(() => {
    const opts = SUBJECTS.map((s) => ({ value: s, label: s }));
    if (showAllOption) {
      opts.unshift({ value: "ALL_SUBJECTS", label: "All Subjects" });
    }
    return opts;
  }, [showAllOption]);

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={cn("relative", className)}>
      <div 
        className="flex h-full w-full items-center justify-between rounded-xl border-2 bg-background px-4 py-2 cursor-pointer hover:border-primary/50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={cn("text-sm font-bold", !selectedLabel && "text-muted-foreground")}>
          {selectedLabel ? (options.find(o => o.value === selectedLabel)?.label || selectedLabel) : placeholder}
        </span>
        <Search className="w-4 h-4 opacity-50" />
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute z-50 mt-2 w-full max-h-60 overflow-auto rounded-xl border bg-white shadow-2xl p-2 animate-in fade-in zoom-in-95">
            <input 
              type="text" 
              className="w-full p-2 mb-2 border-b text-sm focus:outline-none" 
              placeholder="Search..." 
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="space-y-1">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => (
                  <div
                    key={opt.value}
                    className={cn(
                      "p-2 text-sm rounded-lg cursor-pointer hover:bg-primary/5 transition-colors",
                      selectedLabel === opt.value ? "bg-primary/10 text-primary font-bold" : "text-slate-600"
                    )}
                    onClick={() => {
                      setSelectedLabel(opt.value);
                      onSelect(opt.value);
                      setIsOpen(false);
                      setSearchTerm("");
                    }}
                  >
                    {opt.label}
                  </div>
                ))
              ) : (
                <div className="p-2 text-sm text-muted-foreground">No subjects found</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
