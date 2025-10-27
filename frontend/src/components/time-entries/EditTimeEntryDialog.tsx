import { useState, useEffect } from "react"
import { useUpdateTimeEntry } from "@/hooks/useTimeEntries"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface EditTimeEntryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  timeEntry: TimeEntry | null
}

export function EditTimeEntryDialog({
  open,
  onOpenChange,
  timeEntry,
}: EditTimeEntryDialogProps) {
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [description, setDescription] = useState("")

  const updateTimeEntry = useUpdateTimeEntry()

  useEffect(() => {
    if (timeEntry) {
      // Convert ISO date strings to datetime-local format
      const formatForInput = (dateString: string) => {
        return new Date(dateString).toISOString().slice(0, 16)
      }

      setStartTime(formatForInput(timeEntry.startTime))
      setEndTime(timeEntry.endTime ? formatForInput(timeEntry.endTime) : "")
      setDescription(timeEntry.description || "")
    }
  }, [timeEntry])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!timeEntry) return

    await updateTimeEntry.mutateAsync({
      id: timeEntry._id,
      data: {
        startTime: startTime ? new Date(startTime).toISOString() : undefined,
        endTime: endTime ? new Date(endTime).toISOString() : undefined,
        description: description || undefined,
      },
    })

    onOpenChange(false)
  }

  const isLoading = updateTimeEntry.isPending

  if (!timeEntry) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Time Entry</DialogTitle>
            <DialogDescription>
              Update the time entry details.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="start-time">Start Time</Label>
              <Input
                id="start-time"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-time">End Time</Label>
              <Input
                id="end-time"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="What did you work on?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

