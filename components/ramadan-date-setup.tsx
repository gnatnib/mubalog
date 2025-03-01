"use client"

import { useEffect, useState } from "react"
import { Moon, Save, CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { format } from "date-fns"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"

export type RamadanDates = {
  startDate: Date
  endDate: Date
}

interface RamadanDateSetupProps {
  onSave: (dates: RamadanDates) => void
}

export default function RamadanDateSetup({ onSave }: RamadanDateSetupProps) {
  const [open, setOpen] = useState(false)
  const [dates, setDates] = useState<RamadanDates>({
    startDate: new Date(2025, 2, 1), // March 1, 2025
    endDate: new Date(2025, 2, 31), // March 31, 2025
  })
  
  // Track popover states to control them individually
  const [startDateOpen, setStartDateOpen] = useState(false)
  const [endDateOpen, setEndDateOpen] = useState(false)

  useEffect(() => {
    // Check if user has already set Ramadan dates
    const savedDates = localStorage.getItem("ramadanDates")

    if (!savedDates) {
      // If not, open the dialog
      setOpen(true)
    } else {
      try {
        const parsed = JSON.parse(savedDates)
        setDates({
          startDate: new Date(parsed.startDate),
          endDate: new Date(parsed.endDate),
        })
      } catch (error) {
        console.error("Error parsing saved dates:", error)
        setOpen(true)
      }
    }
  }, [])

  const handleSave = () => {
    // Save to localStorage
    localStorage.setItem(
      "ramadanDates",
      JSON.stringify({
        startDate: dates.startDate.toISOString(),
        endDate: dates.endDate.toISOString(),
      }),
    )

    // Call the onSave callback
    onSave(dates)

    // Close the dialog
    setOpen(false)
  }

  return (
    <Dialog 
      open={open} 
      onOpenChange={(newOpen) => {
        // Only allow closing if there are saved dates
        if (localStorage.getItem("ramadanDates") || !newOpen) {
          setOpen(newOpen)
        }
      }}
    >
      <DialogContent 
        className="sm:max-w-[500px]"
        // Prevent closing on outside click by handling mousedown/touchstart
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Moon className="w-6 h-6 text-primary" />
            Welcome to Mubalog
          </DialogTitle>
          <DialogDescription>Please set your Ramadan dates to personalize your experience.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <h3 className="text-lg font-medium">When does Ramadan begin and end in your region?</h3>
            <p className="text-sm text-muted-foreground">
              Different countries may observe Ramadan on slightly different dates. Setting this correctly will help us
              track your progress accurately.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Start Date</label>
              <Popover 
                open={startDateOpen} 
                onOpenChange={setStartDateOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dates.startDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dates.startDate ? format(dates.startDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dates.startDate}
                    onSelect={(date) => {
                      if (date) {
                        setDates((prev) => ({ ...prev, startDate: date }))
                        setStartDateOpen(false) // Close popover after selection
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">End Date</label>
              <Popover 
                open={endDateOpen} 
                onOpenChange={setEndDateOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dates.endDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dates.endDate ? format(dates.endDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dates.endDate}
                    onSelect={(date) => {
                      if (date) {
                        setDates((prev) => ({ ...prev, endDate: date }))
                        setEndDateOpen(false) // Close popover after selection
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-sm">
              <strong>Selected dates:</strong> {format(dates.startDate, "PPP")} to {format(dates.endDate, "PPP")}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              <strong>Duration:</strong>{" "}
              {Math.ceil((dates.endDate.getTime() - dates.startDate.getTime()) / (1000 * 60 * 60 * 24))} days
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSave} className="gap-2">
            <Save className="w-4 h-4" />
            Save and Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}