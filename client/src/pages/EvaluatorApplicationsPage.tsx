import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Clock, MapPin, Search, Filter } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useLocation } from "wouter";
import { useState } from "react";

export default function EvaluatorApplicationsPage() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data, isLoading } = useQuery({
    queryKey: ["evaluator-dashboard"],
    queryFn: () => api.getEvaluatorDashboard(),
  });

  const assignments = data?.assignments || [];
  
  const filteredAssignments = assignments.filter((app: any) =>
    app.institutionName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.applicationType?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="space-y-6" data-testid="evaluator-applications-page">
      <div>
        <h1 className="text-4xl font-medium tracking-tight mb-2">Assigned Applications</h1>
        <p className="text-muted-foreground">
          Review and evaluate applications assigned to you
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by institution, application number, or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-applications"
          />
        </div>
        <Button variant="outline" data-testid="button-filter">
          <Filter className="w-4 h-4 mr-2" />
          Filter
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredAssignments.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">
                {searchTerm ? "No applications found matching your search." : "No applications assigned yet."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredAssignments.map((app: any) => (
            <Card key={app.id} className="hover-elevate transition-shadow" data-testid={`card-application-${app.id}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-medium">{app.institutionName}</h3>
                      <Badge
                        variant={app.priority === "high" ? "destructive" : app.priority === "medium" ? "default" : "secondary"}
                        className="uppercase text-xs"
                      >
                        {app.priority} Priority
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Application #{app.id}
                    </p>
                    <p className="text-sm text-muted-foreground mb-1 capitalize">
                      {app.applicationType?.replace(/-/g, ' ')}
                    </p>
                    {app.courseName && (
                      <p className="text-sm text-muted-foreground mb-3">{app.courseName}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" />
                        {app.location}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        Due: {app.deadline}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setLocation(`/application/${app.id}`)}
                      data-testid={`button-review-${app.id}`}
                    >
                      Review Application
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => setLocation(`/application/${app.id}`)}
                      data-testid={`button-evaluate-${app.id}`}
                    >
                      Start Evaluation
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
