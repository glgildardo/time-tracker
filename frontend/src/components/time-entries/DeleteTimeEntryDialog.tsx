import { useDeleteTimeEntry } from "@/hooks/useTimeEntries"
import type { TimeEntry } from "@/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface DeleteTimeEntryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  timeEntry: TimeEntry | null
}

export function DeleteTimeEntryDialog({
  open,
  onOpenChange,
  timeEntry,
}: DeleteTimeEntryDialogProps) {
  const deleteTimeEntry = useDeleteTimeEntry()

  const handleDelete = async () => {
    if (!timeEntry) return

    await deleteTimeEntry.mutateAsync(timeEntry._id)
    onOpenChange(false)
  }

  if (!timeEntry) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Time Entry</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this time entry? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleteTimeEntry.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteTimeEntry.isPending}
          >
            {deleteTimeEntry.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

