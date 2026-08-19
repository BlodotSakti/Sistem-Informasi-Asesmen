import { useState, useEffect, useRef } from "react";

/**
 * FilterSelect - custom pill-style dropdown untuk mengganti <select> native di
 * area filter tabel
 */
export default function FilterSelect({
    value,
    onChange,
    options = [],
    placeholder = "Semua",
    icon,
    accentClass,
    dropdownAccentClass = "bg-primary text-white",
    className = "",
    align = "right",
    id,
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    const isActive = value !== "" && value !== "all" && value !== undefined && value !== null;
    const selectedLabel = options.find((o) => String(o.value) === String(value))?.label || placeholder;
    const activeClass = accentClass || "bg-primary border-primary text-white shadow-md shadow-primary/25";
    const menuAlignClass = align === "left" ? "left-0" : "right-0";

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <div className={`relative inline-block ${className}`} ref={ref} id={id}>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className={[
                    "flex items-center gap-2 rounded-2xl px-3.5 py-2 text-sm font-semibold border",
                    "transition-all duration-200 outline-none whitespace-nowrap",
                    isActive
                        ? activeClass
                        : "bg-white text-slate-700 border-slate-200 hover:border-primary/40 hover:bg-slate-50 shadow-sm",
                ].join(" ")}
            >
                {icon && <span className="text-base leading-none flex-shrink-0">{icon}</span>}
                <span className="max-w-[160px] truncate">{selectedLabel}</span>
                <svg
                    className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {open && (
                <div className={`absolute ${menuAlignClass} top-full mt-2 z-50 min-w-[190px] max-w-[280px] rounded-2xl border border-slate-100 bg-white shadow-2xl shadow-slate-200/80 overflow-hidden`}>
                    <div className="p-1.5 max-h-72 overflow-y-auto">
                        {options.map((opt) => {
                            const isSelected = String(opt.value) === String(value);
                            return (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => { onChange(opt.value); setOpen(false); }}
                                    className={[
                                        "w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-left transition-colors duration-150",
                                        isSelected ? dropdownAccentClass : "text-slate-700 hover:bg-slate-50",
                                    ].join(" ")}
                                >
                                    {isSelected ? (
                                        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : (
                                        <span className="w-4 flex-shrink-0" />
                                    )}
                                    <span className="truncate">{opt.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
