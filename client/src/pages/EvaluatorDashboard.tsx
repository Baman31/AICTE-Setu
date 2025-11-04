import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipboardCheck, Clock, Calendar, MapPin } from "lucide-react";

export default function EvaluatorDashboard() {
  //todo: remove mock functionality
  const stats = [
    { title: "Assigned Applications", value: "8", icon: ClipboardCheck },
    { title: "Pending Evaluation", value: "3", icon: Clock },
    { title: "Upcoming Site Visits", value: "2", icon: Calendar },
  ];

  const assignments = [
    {
      id: "APP-2025-001234",
      institutionName: "Vellore Institute of Technology",
      applicationType: "New Course Addition",
      location: "Vellore, Tamil Nadu",
      deadline: "Jan 25, 2025",
      priority: "high" as const,
      courseName: "B.Tech in Artificial Intelligence"
    },
    {
      id: "APP-2025-001198",
      institutionName: "BITS Pilani",
      applicationType: "Increase in Intake",
      location: "Pilani, Rajasthan",
      deadline: "Jan 28, 2025",
      priority: "medium" as const,
      courseName: "M.Tech in Embedded Systems"
    },
    {
      id: "APP-2025-001145",
      institutionName: "NIT Trichy",
      applicationType: "New Institution Approval",
      location: "Tiruchirappalli, Tamil Nadu",
      deadline: "Feb 05, 2025",
      priority: "low" as const
    }
  ];

  return (
    <div className="space-y-6" data-testid="evaluator-dashboard">
      <div>
        <h1 className="text-4xl font-medium tracking-tight mb-2">Evaluator Dashboard</h1>
        <p className="text-muted-foreground">
          Review and evaluate assigned applications
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" data-testid={`stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                  {stat.value}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div>
        <h2 className="text-2xl font-medium mb-4">Assigned Applications</h2>
        <div className="space-y-4">
          {assignments.map(app => (
            <Card key={app.id} className="hover-elevate transition-shadow" data-testid={`card-assignment-${app.id}`}>
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
                    <p className="text-sm text-muted-foreground mb-1">{app.applicationType}</p>
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
                    <Button variant="outline" size="sm" data-testid={`button-review-${app.id}`}>
                      Review Application
                    </Button>
                    <Button size="sm" data-testid={`button-evaluate-${app.id}`}>
                      Start Evaluation
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
