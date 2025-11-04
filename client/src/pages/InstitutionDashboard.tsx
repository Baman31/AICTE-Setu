import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ApplicationCard from "@/components/ApplicationCard";
import { Plus, FileText, Clock, CheckCircle, XCircle } from "lucide-react";

export default function InstitutionDashboard() {
  //todo: remove mock functionality
  const stats = [
    { title: "Total Applications", value: "12", icon: FileText, color: "text-blue-600" },
    { title: "In Progress", value: "5", icon: Clock, color: "text-yellow-600" },
    { title: "Approved", value: "6", icon: CheckCircle, color: "text-green-600" },
    { title: "Rejected", value: "1", icon: XCircle, color: "text-red-600" },
  ];

  const applications = [
    {
      id: "APP-2025-001234",
      institutionName: "Indian Institute of Technology, Mumbai",
      applicationType: "New Institution Approval",
      status: "under_evaluation" as const,
      submittedDate: "Jan 15, 2025",
      location: "Mumbai, Maharashtra",
      courseName: "B.Tech in Computer Science"
    },
    {
      id: "APP-2025-001189",
      institutionName: "Indian Institute of Technology, Mumbai",
      applicationType: "Increase in Intake",
      status: "document_verification" as const,
      submittedDate: "Jan 10, 2025",
      location: "Mumbai, Maharashtra",
      courseName: "M.Tech in Data Science"
    },
    {
      id: "APP-2024-009876",
      institutionName: "Indian Institute of Technology, Mumbai",
      applicationType: "Extension of Approval",
      status: "approved" as const,
      submittedDate: "Dec 20, 2024",
      location: "Mumbai, Maharashtra"
    }
  ];

  return (
    <div className="space-y-6" data-testid="institution-dashboard">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-medium tracking-tight mb-2">Welcome Back</h1>
          <p className="text-muted-foreground">
            Manage your AICTE approval applications
          </p>
        </div>
        <Button size="lg" data-testid="button-new-application">
          <Plus className="w-4 h-4 mr-2" />
          New Application
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className={`w-4 h-4 ${stat.color}`} />
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
        <h2 className="text-2xl font-medium mb-4">Recent Applications</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {applications.map(app => (
            <ApplicationCard
              key={app.id}
              {...app}
              onViewDetails={() => console.log('View details:', app.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
