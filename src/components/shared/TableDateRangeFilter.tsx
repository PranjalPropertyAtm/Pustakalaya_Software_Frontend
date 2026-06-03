import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface TableDateRangeFilterProps {
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
}

export function TableDateRangeFilter({
  from,
  to,
  onFromChange,
  onToChange,
}: TableDateRangeFilterProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="space-y-1.5">
        <Label className="text-xs">From date</Label>
        <Input
          type="date"
          value={from}
          onChange={(e) => onFromChange(e.target.value)}
          className="h-8"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">To date</Label>
        <Input
          type="date"
          value={to}
          onChange={(e) => onToChange(e.target.value)}
          className="h-8"
        />
      </div>
    </div>
  );
}
