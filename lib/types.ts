export type Area = {
  id: string;
  name: string;
};

export type Project = {
  id: string;
  title: string;
  areaId?: string;
  description: string;
  endDate?: string;
  notes: string;
};

export type KnowledgeProject = {
  id: string;
  title: string;
  description: string;
  status: "idea" | "active" | "paused" | "complete";
};

export type KnowledgeProjectPage = {
  id: string;
  projectId: string;
  title: string;
  content: string;
  position: number;
};

export type KnowledgeProjectBlock = {
  id: string;
  pageId: string;
  type: "checklist" | "link" | "table";
  title: string;
  content: string;
  position: number;
};

export type Task = {
  id: string;
  title: string;
  areaId: string;
  projectId?: string;
  dueDate?: string;
  dueToday: boolean;
  priority: "none" | "low" | "medium" | "high";
  notes: string;
  recurrence: "none" | "daily" | "weekly" | "monthly";
  done: boolean;
};

export type Routine = {
  id: string;
  title: string;
  category: string;
  rhythm: "flexible" | "fixed";
  period: "day" | "week" | "month";
  target: number;
  completed: number;
  amount?: number;
  unit: string;
  preferredWeekdays: number[];
  reminderTime?: string;
  startDate?: string;
  endDate?: string;
  color: "teal" | "green" | "rose" | "violet" | "blue";
  symbol: "repeat" | "activity" | "book" | "heart" | "leaf";
  completionDates: string[];
};

export type InboxItem = {
  id: string;
  text: string;
  createdAt: string;
};

export type TrackingEntry = {
  id: string;
  trackerId: string;
  startedAt: string;
  endedAt?: string;
  data: Record<string, unknown>;
  notes: string;
};

export type TrackingTracker = {
  id: string;
  type: "menstruation" | "headache" | "custom";
  name: string;
  inputType?:
    | "boolean"
    | "scale"
    | "number"
    | "duration"
    | "multiselect"
    | "text";
  unit?: string;
  options: string[];
  fields: TrackingField[];
  color: "rose" | "peach" | "violet" | "blue" | "teal";
};

export type TrackingField = {
  id: string;
  label: string;
  type:
    | "boolean"
    | "scale"
    | "number"
    | "duration"
    | "multiselect"
    | "text";
  unit?: string;
  aggregation?: "day" | "week" | "month" | "none";
  options: string[];
};
