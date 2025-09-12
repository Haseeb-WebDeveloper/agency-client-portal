import { Sparkles } from "lucide-react";

export const ClientStatusConfig = {
    DRAFT: {
      label: "Draft",
      color: "",
      icon: null,
    },
    SENT: {
      label: "Pending Review",
      color: "text-destructive",
      icon: null,
    },
    SEEN: {
      label: "Pending Review",
      color: "text-destructive",
      icon: Sparkles,
    },
    ACCEPTED: {
      label: "Accepted",
      color: "text-success",
      icon: null,
    },
    DECLINED: {
      label: "Declined",
      color: "text-destructive",
      icon: null,
    },
    EXPIRED: {
      label: "Expired",
      color: "text-muted-foreground",
      icon: null,
    },
    WITHDRAWN: {
      label: "Withdrawn",
      color: "text-muted-foreground",
      icon: null,
    },
  };