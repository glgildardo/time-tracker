import { TaskFormDialog } from "./TaskFormDialog"
import type { Task } from "@/types"

interface EditTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: Task | null
}

export function EditTaskDialog({
  open,
  onOpenChange,
  task,
}: EditTaskDialogProps) {
  return <TaskFormDialog open={open} onOpenChange={onOpenChange} task={task} />
}

