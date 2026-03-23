import PageHeader from "@/components/admin/PageHeader";

interface BrandStudioRouteHeaderProps {
  title: string;
  description: string;
  trail?: Array<{ label: string; href?: string }>;
}

export default function BrandStudioRouteHeader({ title, description, trail = [] }: BrandStudioRouteHeaderProps) {
  return (
    <PageHeader
      title={title}
      description={description}
      breadcrumbs={[
        { label: "Brand Studio AI", href: "/admin/brand-studio" },
        ...trail,
      ]}
    />
  );
}
