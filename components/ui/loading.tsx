import { Card, CardContent } from "@/components/ui/card";

interface LoadingProps {
  text?: string;
  cards?: number;
}

export function Loading({ text = "Loading...", cards = 1 }: LoadingProps) {
  return (
    <div className="space-y-4">
      {text && (
        <div className="text-center text-foreground/60">
          {text}
        </div>
      )}
      
      {Array.from({ length: cards }).map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 bg-surface rounded-full"></div>
              <div className="flex-1 space-y-3">
                <div className="h-4 bg-surface rounded w-3/4"></div>
                <div className="h-3 bg-surface rounded w-1/2"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-surface rounded"></div>
                  <div className="h-3 bg-surface rounded w-5/6"></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-surface rounded ${className}`}></div>
  );
}