import TimelineView from '../TimelineView';

export default function TimelineViewExample() {
  const stages = [
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
      description: "AI-powered document analysis in progress",
      date: "Jan 17, 2025",
      assignedTo: "System AI Engine",
      status: "current" as const
    },
    {
      id: "4",
      title: "Evaluator Assignment",
      description: "Pending expert evaluator allocation",
      status: "pending" as const
    },
    {
      id: "5",
      title: "Site Visit & Evaluation",
      status: "pending" as const
    },
    {
      id: "6",
      title: "Final Approval",
      status: "pending" as const
    }
  ];

  return (
    <div className="p-6 max-w-2xl">
      <TimelineView stages={stages} />
    </div>
  );
}
