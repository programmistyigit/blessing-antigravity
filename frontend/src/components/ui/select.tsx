import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

// Simple custom select implementation to avoid Radix dependency issues for now
// while maintaining the API expected by SectionStatusDialog

interface SelectProps {
    value: string;
    onValueChange: (value: string) => void;
    children: React.ReactNode;
}

const SelectContext = React.createContext<{
    value: string;
    onValueChange: (value: string) => void;
    open: boolean;
    setOpen: (open: boolean) => void;
} | null>(null);

export const Select = ({ value, onValueChange, children }: SelectProps) => {
    const [open, setOpen] = React.useState(false);

    return (
        <SelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
            <div className="relative">{children}</div>
        </SelectContext.Provider>
    );
};

export const SelectTrigger = ({ children, className }: { children: React.ReactNode; className?: string }) => {
    const context = React.useContext(SelectContext);
    if (!context) throw new Error("SelectTrigger used outside Select");

    return (
        <button
            type="button"
            onClick={() => context.setOpen(!context.open)}
            className={cn(
                "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                className
            )}
        >
            {children}
            <ChevronDown className="h-4 w-4 opacity-50" />
        </button>
    );
};

export const SelectValue = ({ placeholder }: { placeholder?: string }) => {
    const context = React.useContext(SelectContext);
    if (!context) throw new Error("SelectValue used outside Select");

    // We can't easily find the label for the value without more complex context or children traversal in this simple version
    // So we'll validly cheat: The parent component usually knows what to display, or we display the value.
    // For SectionStatusDialog, it displays simple text.
    return <span>{context.value || placeholder}</span>;
}

export const SelectContent = ({ children, className }: { children: React.ReactNode; className?: string }) => {
    const context = React.useContext(SelectContext);
    if (!context) throw new Error("SelectContent used outside Select");

    if (!context.open) return null;

    return (
        <div className={cn(
            "absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-80 w-full mt-1",
            className
        )}>
            <div className="p-1">{children}</div>
        </div>
    );
};

export const SelectItem = ({ value, children, className, disabled }: { value: string; children: React.ReactNode; className?: string; disabled?: boolean }) => {
    const context = React.useContext(SelectContext);
    if (!context) throw new Error("SelectItem used outside Select");

    return (
        <div
            onClick={() => {
                if (!disabled) {
                    context.onValueChange(value);
                    context.setOpen(false);
                }
            }}
            className={cn(
                "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-800",
                disabled && "opacity-50 cursor-not-allowed hover:bg-transparent",
                className
            )}
        >
            {context.value === value && (
                <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                    <span className="h-2 w-2 rounded-full bg-current" />
                </span>
            )}
            {children}
        </div>
    );
};
