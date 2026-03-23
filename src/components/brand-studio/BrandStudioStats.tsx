import StatsGrid from "@/components/admin/StatsGrid";
import StatCard from "@/components/admin/StatCard";
import { Layers3, NotebookPen, ListChecks, Image, Sparkles, Eye } from "lucide-react";
import type { BrandStudioOverviewStats } from "@/types/brand-studio";

interface BrandStudioStatsProps {
  stats: BrandStudioOverviewStats;
}

export default function BrandStudioStats({ stats }: BrandStudioStatsProps) {
  return (
    <StatsGrid columns={6}>
      <StatCard title="Projetos" value={stats.projects} icon={<Layers3 className="h-5 w-5" />} />
      <StatCard title="Briefings" value={stats.briefs} icon={<NotebookPen className="h-5 w-5" />} />
      <StatCard title="Tarefas" value={stats.tasks} icon={<ListChecks className="h-5 w-5" />} />
      <StatCard title="Assets" value={stats.assets} icon={<Image className="h-5 w-5" />} />
      <StatCard title="Execucoes IA" value={stats.aiRuns} icon={<Sparkles className="h-5 w-5" />} />
      <StatCard title="Pend. Revisao" value={stats.pendingReviews} icon={<Eye className="h-5 w-5" />} />
    </StatsGrid>
  );
}
