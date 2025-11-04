import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StatusBadge from "@/components/StatusBadge";
import TimelineView from "@/components/TimelineView";
import MessagingPanel from "@/components/MessagingPanel";
import { ArrowLeft, Download, FileText, Image as ImageIcon } from "lucide-react";

export default function ApplicationDetailPage() {
  //todo: remove mock functionality
  const application = {
    id: "APP-2025-001234",
    institutionName: "Indian Institute of Technology, Mumbai",
    applicationType: "New Institution Approval",
    status: "under_evaluation" as const,
    submittedDate: "Jan 15, 2025",
    location: "Mumbai, Maharashtra",
    courseName: "B.Tech in Computer Science",
    intake: 120
  };

  const timelineStages = [
    {
      id: "1",
      title: "Application Submitted",
      description: "Application received and under initial review",
      date: "Jan 15, 2025, 10:30 AM",
      status: "completed" as const
    },
    {
      id: "2",
      title: "Initial Scrutiny",
      description: "Basic compliance checks completed",
      date: "Jan 16, 2025, 2:15 PM",
      status: "completed" as const
    },
    {
      id: "3",
      title: "Document Verification",
      description: "AI-powered document analysis completed with 95% compliance",
      date: "Jan 17, 2025, 11:00 AM",
      status: "completed" as const
    },
    {
      id: "4",
      title: "Evaluator Assignment",
      description: "Expert evaluator assigned for detailed review",
      date: "Jan 18, 2025",
      assignedTo: "Dr. Rajesh Kumar",
      status: "current" as const
    },
    {
      id: "5",
      title: "Site Visit & Evaluation",
      description: "Pending site visit scheduling",
      status: "pending" as const
    },
    {
      id: "6",
      title: "Final Approval",
      status: "pending" as const
    }
  ];

  const documents = [
    { name: "Affidavit_Trust_Deed.pdf", size: "2.4 MB", status: "Verified" },
    { name: "Land_Documents.pdf", size: "5.1 MB", status: "Verified" },
    { name: "Building_Plan_NOC.pdf", size: "3.8 MB", status: "Verified" },
    { name: "Infrastructure_Photos.zip", size: "15.2 MB", status: "Under Review" }
  ];

  const messages = [
    {
      id: "1",
      sender: "Dr. Rajesh Kumar",
      senderRole: "Evaluator",
      content: "I have reviewed the infrastructure documents. Could you please provide additional photos of the laboratory equipment?",
      timestamp: "Jan 18, 2025, 10:30 AM",
      isCurrentUser: false
    },
    {
      id: "2",
      sender: "Current User",
      senderRole: "Institution",
      content: "Thank you for the feedback. I will upload the additional laboratory photos by end of day today.",
      timestamp: "Jan 18, 2025, 11:15 AM",
      isCurrentUser: true
    }
  ];

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
              <TimelineView stages={timelineStages} />
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
                        <p className="font-medium">{doc.name}</p>
                        <p className="text-sm text-muted-foreground">{doc.size} • {doc.status}</p>
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
            <MessagingPanel applicationId={application.id} messages={messages} />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
