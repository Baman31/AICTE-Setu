import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, XCircle, AlertCircle, FileText, UserCheck } from "lucide-react";

type StatusType = 
  | "draft"
  | "submitted"
  | "in_scrutiny"
  | "document_verification"
  | "evaluator_assigned"
  | "under_evaluation"
  | "approved"
  | "rejected"
  | "conditional";

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusConfig: Record<StatusType, { label: string; icon: any; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Draft", icon: FileText, variant: "secondary" },
  submitted: { label: "Submitted", icon: Clock, variant: "default" },
  in_scrutiny: { label: "In Scrutiny", icon: Clock, variant: "default" },
  document_verification: { label: "Document Verification", icon: FileText, variant: "default" },
  evaluator_assigned: { label: "Evaluator Assigned", icon: UserCheck, variant: "default" },
  under_evaluation: { label: "Under Evaluation", icon: Clock, variant: "default" },
  approved: { label: "Approved", icon: CheckCircle2, variant: "default" },
  rejected: { label: "Rejected", icon: XCircle, variant: "destructive" },
  conditional: { label: "Conditional Approval", icon: AlertCircle, variant: "outline" },
};

export default function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  const getStatusColor = () => {
    if (status === "approved") return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800";
    if (status === "rejected") return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800";
    if (status === "conditional") return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800";
    if (status === "draft") return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700";
    return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800";
  };

  return (
    <Badge 
      variant={config.variant}
      className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium uppercase tracking-wide border ${getStatusColor()} ${className}`}
      data-testid={`badge-status-${status}`}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
}
