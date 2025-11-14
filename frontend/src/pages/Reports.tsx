import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, ChevronLeft, ChevronRight, Copy, Check } from "lucide-react"
import { useWeeklySummary } from "@/hooks/useWeeklySummary"
import { format, startOfWeek, subWeeks, addWeeks } from "date-fns"
import type { TaskSummary } from "@/types"
import { useState } from "react"
import { useSearchParams } from "react-router-dom"

export default function ReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [copied, setCopied] = useState(false)

  // Get weekStart from query params, default to undefined (current week)
  const weekStartParam = searchParams.get('weekStart')
  const selectedWeekStart = weekStartParam || undefined

  // Update URL when week changes
  const updateWeekInUrl = (weekStart: string | undefined) => {
    const newParams = new URLSearchParams(searchParams)
    if (weekStart) {
      newParams.set('weekStart', weekStart)
    } else {
      newParams.delete('weekStart')
    }
    setSearchParams(newParams, { replace: true })
  }

  const { data: weeklySummary, isLoading } = useWeeklySummary(selectedWeekStart)

  // Group tasks by project name
  const tasksByProject = new Map<string, Set<string>>()

  if (weeklySummary?.taskSummaries) {
    weeklySummary.taskSummaries.forEach((task: TaskSummary) => {
      const projectName = task.projectName || 'Unassigned'
      if (!tasksByProject.has(projectName)) {
        tasksByProject.set(projectName, new Set())
      }
      tasksByProject.get(projectName)!.add(task.taskName)
    })
  }

  // Convert Map to array for rendering
  const projectGroups = Array.from(tasksByProject.entries()).map(([projectName, tasks]) => ({
    projectName,
    tasks: Array.from(tasks),
  }))

  // Week navigation handlers
  const handlePreviousWeek = () => {
    if (!weeklySummary) return;
    const currentWeekStart = new Date(weeklySummary.weekStart);
    const newWeekStart = subWeeks(currentWeekStart, 1);
    updateWeekInUrl(format(startOfWeek(newWeekStart), 'yyyy-MM-dd'));
  };

  const handleNextWeek = () => {
    if (!weeklySummary) return;
    const currentWeekStart = new Date(weeklySummary.weekStart);
    const newWeekStart = addWeeks(currentWeekStart, 1);
    updateWeekInUrl(format(startOfWeek(newWeekStart), 'yyyy-MM-dd'));
  };

  const handleCurrentWeek = () => {
    updateWeekInUrl(undefined);
  };

  // Format the week range for display
  const weekRange = weeklySummary
    ? `${format(new Date(weeklySummary.weekStart), 'MMM d')} - ${format(new Date(weeklySummary.weekEnd), 'MMM d, yyyy')}`
    : ''

  // Determine if we're showing current week or a past week
  const isCurrentWeek = !selectedWeekStart || 
    format(startOfWeek(new Date()), 'yyyy-MM-dd') === selectedWeekStart;
  const isPreviousWeek = selectedWeekStart === format(subWeeks(startOfWeek(new Date()), 1), 'yyyy-MM-dd');
  
  const titleText = isCurrentWeek 
    ? 'What was done this week'
    : isPreviousWeek
    ? 'What was done last week'
    : 'What was done that week'

  // Format text for clipboard
  const formatTextForClipboard = () => {
    if (!weeklySummary || projectGroups.length === 0) {
      return '';
    }

    let text = `${titleText}:\n\n`;
    
    projectGroups.forEach((group) => {
      text += `${group.projectName}:\n`;
      group.tasks.forEach((task) => {
        text += `- ${task}\n`;
      });
      text += '\n';
    });

    return text.trim();
  };

  const handleCopy = async () => {
    const textToCopy = formatTextForClipboard();
    if (!textToCopy) return;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-bold text-3xl text-balance">Reports</h1>
        <p className="text-muted-foreground">Weekly task reports and summaries</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{titleText}</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                disabled={isLoading || projectGroups.length === 0}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousWeek}
                disabled={isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCurrentWeek}
                disabled={isLoading || isCurrentWeek}
              >
                Current Week
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextWeek}
                disabled={isLoading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {weekRange && (
            <p className="text-sm text-muted-foreground mt-2">
              {weekRange}
            </p>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : projectGroups.length > 0 ? (
            <div className="space-y-6">
              {projectGroups.map((group) => (
                <div key={group.projectName} className="space-y-2">
                  <h3 className="font-semibold text-lg">{group.projectName}:</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    {group.tasks.map((taskName, index) => (
                      <li key={`${group.projectName}-${index}`} className="text-muted-foreground">
                        {taskName}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No tasks completed {isCurrentWeek ? 'this week' : isPreviousWeek ? 'last week' : 'for this week'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

