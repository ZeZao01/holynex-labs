import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BRAND_STUDIO_ROUTES } from "@/lib/brand-studio";

export default function BrandStudioSectionLinks() {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {BRAND_STUDIO_ROUTES.filter((route) => route.path !== "/admin/brand-studio").map((route) => (
        <Card key={route.path} className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{route.label}</CardTitle>
            <CardDescription className="text-xs">{route.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" className="w-full" onClick={() => navigate(route.path)}>
              Abrir modulo <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
