"use client";

import * as React from "react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  CalendarIcon,
  CheckCircle2Icon,
  FolderIcon,
  ListPlusIcon,
  MailIcon,
  PlusIcon,
  SparklesIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { convertEmailToTask } from "@/lib/actions/gmail";
import { extractActionItemsFromEmail, type GmailEmailMessage } from "@/lib/integrations/gmail";
import type { Priority } from "@/lib/validations/todo";
import { useTodoStore } from "@/stores/todo-store";
import { useRouter } from "next/navigation";

interface EmailToTaskDialogProps {
  email: GmailEmailMessage | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (taskId: string) => void;
}

interface EmailToTaskFormProps {
  email: GmailEmailMessage;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (taskId: string) => void;
}

function EmailToTaskForm({ email, onOpenChange, onSuccess }: EmailToTaskFormProps) {
  const router = useRouter();
  const { projects } = useTodoStore();

  const extracted = React.useMemo(() => {
    return extractActionItemsFromEmail(email.subject, email.bodyText || email.snippet);
  }, [email]);

  const [title, setTitle] = React.useState(extracted.cleanTitle);
  const [description, setDescription] = React.useState(
    `From: ${email.from}\nDate: ${new Date(email.date).toLocaleString()}\n\n${email.snippet}`
  );
  const [priority, setPriority] = React.useState<Priority>(extracted.priority);
  const [dueDate, setDueDate] = React.useState(extracted.dueDate || email.suggestedDueDate || "");
  const [projectId, setProjectId] = React.useState("");
  const [myDay, setMyDay] = React.useState(extracted.priority === "urgent");
  const [subtasksList, setSubtasksList] = React.useState<string[]>(
    extracted.actionItems || email.suggestedActionItems || []
  );
  const [newSubtaskInput, setNewSubtaskInput] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleAddSubtask = () => {
    if (!newSubtaskInput.trim()) return;
    setSubtasksList((prev) => [...prev, newSubtaskInput.trim()]);
    setNewSubtaskInput("");
  };

  const handleRemoveSubtask = (idx: number) => {
    setSubtasksList((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a task title");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await convertEmailToTask({
        emailId: email.id,
        emailSubject: email.subject,
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        dueDate: dueDate || undefined,
        projectId: projectId || undefined,
        myDay,
        subtasksList: subtasksList.filter(Boolean),
      });

      if (res.success) {
        toast.success("Task created from email!", {
          description: `"${title.trim()}" added to your workspace`,
          action: {
            label: "Open Tasks",
            onClick: () => router.push("/todo"),
          },
        });
        onOpenChange(false);
        if (onSuccess) onSuccess(res.taskId);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create task";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <DrawerHeader className="flex flex-row items-start justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3 text-left">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <MailIcon className="size-4" />
          </div>
          <div>
            <DrawerTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <span>Convert Email to Task</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                <SparklesIcon className="size-2.5" />
                AI Suggested
              </span>
            </DrawerTitle>
            <DrawerDescription className="text-xs text-muted-foreground mt-0.5">
              Review and customize task properties extracted from this message
            </DrawerDescription>
          </div>
        </div>
        <DrawerClose asChild>
          <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground">
            <XIcon className="size-4" />
          </Button>
        </DrawerClose>
      </DrawerHeader>

      {/* Source Email Banner */}
      <div className="mx-6 mt-4 flex items-center justify-between rounded-xl border border-border bg-secondary/50 p-3 text-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-base">📧</span>
          <div className="min-w-0">
            <div className="font-semibold text-foreground truncate">{email.subject}</div>
            <div className="text-muted-foreground truncate text-[11px]">
              {email.fromName} ({email.fromEmail}) • {new Date(email.date).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleConvert} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
        {/* Task Title */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">Task Title</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Review Q4 Product Architecture"
            required
            className="h-10 border-border bg-secondary text-foreground text-sm font-medium"
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">Description & Context</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Add task notes or email context..."
            className="w-full rounded-md border border-border bg-secondary p-3 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Priority & Due Date & Project */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Priority */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="w-full h-9 rounded-md border border-border bg-secondary px-2.5 text-xs text-foreground outline-none cursor-pointer"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          {/* Due Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1">
              <CalendarIcon className="size-3 text-muted-foreground" />
              <span>Due Date</span>
            </label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="h-9 border-border bg-secondary text-foreground text-xs"
            />
          </div>

          {/* Project */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1">
              <FolderIcon className="size-3 text-muted-foreground" />
              <span>Project</span>
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full h-9 rounded-md border border-border bg-secondary px-2.5 text-xs text-foreground outline-none cursor-pointer"
            >
              <option value="">Inbox (No project)</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* My Day Toggle */}
        <label className="flex items-center gap-2.5 text-xs text-foreground cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={myDay}
            onChange={(e) => setMyDay(e.target.checked)}
            className="size-4 rounded border-border text-primary focus:ring-primary"
          />
          <span>Add to My Day (Focus workspace)</span>
        </label>

        {/* Subtasks / Action Items */}
        <div className="space-y-2 pt-2 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <ListPlusIcon className="size-3.5 text-primary" />
              <span>Extracted Action Steps ({subtasksList.length})</span>
            </span>
          </div>

          <div className="space-y-1.5">
            {subtasksList.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-2 rounded-lg border border-border bg-secondary/60 px-3 py-1.5 text-xs text-foreground"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircle2Icon className="size-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate">{item}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveSubtask(idx)}
                  className="text-muted-foreground hover:text-destructive cursor-pointer p-0.5"
                  title="Remove step"
                >
                  <Trash2Icon className="size-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Add manual subtask */}
          <div className="flex items-center gap-2 pt-1">
            <Input
              value={newSubtaskInput}
              onChange={(e) => setNewSubtaskInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddSubtask();
                }
              }}
              placeholder="Add actionable subtask step..."
              className="h-8 border-border bg-secondary text-xs text-foreground"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddSubtask}
              className="h-8 gap-1 text-xs shrink-0 cursor-pointer"
            >
              <PlusIcon className="size-3" />
              <span>Add</span>
            </Button>
          </div>
        </div>

        <DrawerFooter className="px-0 pt-4 flex flex-row items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-9 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium cursor-pointer"
          >
            <CheckCircle2Icon className="size-3.5" />
            <span>{isSubmitting ? "Creating Task..." : "Save to Tasks"}</span>
          </Button>
        </DrawerFooter>
      </form>
    </>
  );
}

export function EmailToTaskDialog({
  email,
  open,
  onOpenChange,
  onSuccess,
}: EmailToTaskDialogProps) {
  const { fetchProjects } = useTodoStore();

  React.useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto max-w-2xl border-border bg-card text-card-foreground">
        {email && (
          <EmailToTaskForm
            key={email.id}
            email={email}
            onOpenChange={onOpenChange}
            onSuccess={onSuccess}
          />
        )}
      </DrawerContent>
    </Drawer>
  );
}
