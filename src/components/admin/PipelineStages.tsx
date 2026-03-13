import { cn } from "@/lib/utils";

interface PipelineStage {
  label: string;
  count: number;
  color?: string;
}

interface PipelineStagesProps {
  stages: PipelineStage[];
}

export default function PipelineStages({ stages }: PipelineStagesProps) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-2">
      {stages.map((stage, i) => (
        <div key={i} className="flex items-center gap-1 shrink-0">
          <div className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-lg bg-muted/50 border border-border/50 min-w-[100px]">
            <span className="text-xl font-bold font-display">{stage.count}</span>
            <span className="text-[10px] text-muted-foreground text-center leading-tight">{stage.label}</span>
          </div>
          {i < stages.length - 1 && (
            <div className="w-4 h-[2px] bg-border shrink-0" />
          )}
        </div>
      ))}
    </div>
  );
}
