import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StatusBadge from "@/components/StatusBadge";
import TimelineView from "@/components/TimelineView";
import MessagingPanel from "@/components/MessagingPanel";
import { ArrowLeft, Download, FileText, Image as ImageIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useRoute, useLocation } from "wouter";

export default function ApplicationDetailPage() {
  const [, params] = useRoute("/application/:id");
  const [, setLocation] = useLocation();
  const applicationId = params?.id || "";

  const { data: applicationData, isLoading } = useQuery({
    queryKey: ["/api/applications", applicationId],
    queryFn: () => api.getApplication(applicationId),
    enabled: !!applicationId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading application...</p>
        </div>
      </div>
    );
  }

  if (!applicationData?.application) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-xl font-medium mb-2">Application not found</p>
          <Button onClick={() => setLocation("/dashboard")}>Go to Dashboard</Button>
        </div>
      </div>
    );
  }

  const application = applicationData.application;
  const documents = applicationData.documents || [];
  const messages = applicationData.messages || [];
  const timelineStages = applicationData.timeline || [];

  // Format timeline stages for the TimelineView component
  const formattedTimeline = timelineStages.map((stage: any) => ({
    id: stage.id,
    title: stage.title,
    description: stage.description,
    date: stage.completedAt ? new Date(stage.completedAt).toLocaleDateString() : undefined,
    assignedTo: stage.assignedTo,
    status: stage.status
  }));

  // Format messages for MessagingPanel
  const formattedMessages = messages.map((msg: any) => ({
    id: msg.id,
    sender: msg.senderName,
    senderRole: msg.senderRole,
    content: msg.content,
    timestamp: new Date(msg.createdAt).toLocaleString(),
    isCurrentUser: false
  }));

  return (
    <div className="space-y-6" data-testid="application-detail-page">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" data-testid="button-back">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-4xl font-medium tracking-tight mb-2">{application.institutionName}</h1>
          <p className="text-muted-foreground">Application ID: {application.id}</p>
        </div>
        <StatusBadge status={application.status} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Application Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Application Type</p>
              <p className="font-medium">{application.applicationType}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Course Name</p>
              <p className="font-medium">{application.courseName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Proposed Intake</p>
              <p className="font-medium">{application.intake} students</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Location</p>
              <p className="font-medium">{application.location}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Submitted Date</p>
              <p className="font-medium">{application.submittedDate}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Current Status</p>
              <StatusBadge status={application.status} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="timeline" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="timeline" data-testid="tab-timeline">Timeline</TabsTrigger>
          <TabsTrigger value="documents" data-testid="tab-documents">Documents</TabsTrigger>
          <TabsTrigger value="messages" data-testid="tab-messages">Messages</TabsTrigger>
        </TabsList>
        
        <TabsContent value="timeline" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Application Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <TimelineView stages={formattedTimeline} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Uploaded Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {documents.map((doc, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-lg border hover-elevate"
                    data-testid={`document-${index}`}
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-primary" />
                      <div>
                        <p className="font-medium">{doc.fileName}</p>
                        <p className="text-sm text-muted-foreground">{doc.category} • {doc.status || 'Pending'}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" data-testid={`button-download-${index}`}>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages" className="mt-6">
          <Card className="h-[600px] flex flex-col">
            <MessagingPanel applicationId={application.id} messages={formattedMessages} />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
