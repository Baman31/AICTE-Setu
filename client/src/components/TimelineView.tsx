import { CheckCircle2, Circle, Clock } from "lucide-react";

interface TimelineStage {
  id: string;
  title: string;
  description?: string;
  date?: string;
  status: "completed" | "current" | "pending";
  assignedTo?: string;
}

interface TimelineViewProps {
  stages: TimelineStage[];
}

export default function TimelineView({ stages }: TimelineViewProps) {
  return (
    <div className="space-y-6" data-testid="timeline-view">
      {stages.map((stage, index) => {
        const isLast = index === stages.length - 1;
        
        return (
          <div key={stage.id} className="relative flex gap-4">
            {!isLast && (
              <div 
                className={`absolute left-4 top-8 w-0.5 h-full ${
                  stage.status === "completed" ? "bg-primary" : "bg-border"
                }`}
              />
            )}
            
            <div className="relative z-10">
              {stage.status === "completed" && (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-primary-foreground" />
                </div>
              )}
              {stage.status === "current" && (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center animate-pulse">
                  <Clock className="w-5 h-5 text-primary-foreground" />
                </div>
              )}
              {stage.status === "pending" && (
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <Circle className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
            </div>

            <div className="flex-1 pb-6">
              <h4 className="font-medium text-base mb-1" data-testid={`text-stage-${stage.id}`}>
                {stage.title}
              </h4>
              {stage.description && (
                <p className="text-sm text-muted-foreground mb-2">{stage.description}</p>
              )}
              {stage.date && (
                <p className="text-xs text-muted-foreground">{stage.date}</p>
              )}
              {stage.assignedTo && (
                <p className="text-xs text-muted-foreground mt-1">
                  Assigned to: {stage.assignedTo}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
