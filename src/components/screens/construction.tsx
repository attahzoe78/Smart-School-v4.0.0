"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";

interface ConstructionScreenProps {
  module: string;
}

export function ConstructionScreen({ module }: ConstructionScreenProps) {
  return (
    <div className="space-y-6">
      <PageHeader title={module.replace(/-/g, " ")} description="Module under construction" />
      <Card>
        <CardContent className="py-16 text-center">
          <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-amber-100 text-amber-600 mb-4">
            <Construction className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-semibold">Coming Soon</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            This module is part of Smart School v4.0.0 and is being developed. It will be available in a future update.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
