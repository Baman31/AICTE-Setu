import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatusBadge from "./StatusBadge";
import { Calendar, MapPin, FileText, ArrowRight } from "lucide-react";

interface ApplicationCardProps {
  id: string;
  institutionName: string;
  applicationType: string;
  status: any;
  submittedDate: string;
  location: string;
  courseName?: string;
  onViewDetails?: () => void;
}

export default function ApplicationCard({
  id,
  institutionName,
  applicationType,
  status,
  submittedDate,
  location,
  courseName,
  onViewDetails
}: ApplicationCardProps) {
  return (
    <Card className="hover-elevate transition-shadow" data-testid={`card-application-${id}`}>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-medium leading-tight mb-1 truncate" data-testid="text-institution">
            {institutionName}
          </h3>
          <p className="text-sm text-muted-foreground truncate">{applicationType}</p>
          {courseName && (
            <p className="text-xs text-muted-foreground mt-1">{courseName}</p>
          )}
        </div>
        <StatusBadge status={status} />
      </CardHeader>
      
      <CardContent className="space-y-3 pb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>Submitted: {submittedDate}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4" />
          <span>{location}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="w-4 h-4" />
          <span>Application ID: {id}</span>
        </div>
      </CardContent>

      <CardFooter className="flex justify-end gap-2 pt-4 border-t">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => {
            console.log('View application:', id);
            onViewDetails?.();
          }}
          data-testid="button-view-details"
        >
          View Details
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </CardFooter>
    </Card>
  );
}
