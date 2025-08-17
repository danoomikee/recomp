"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Download, Copy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Project } from "@/lib/schemas"

interface ExportDialogProps {
  project: Project
  transcriptMap: Record<string, string>
  trigger?: React.ReactNode
}

export function ExportDialog({ project, transcriptMap, trigger }: ExportDialogProps) {
  const [open, setOpen] = useState(false)
  const [format, setFormat] = useState("plain")
  const { toast } = useToast()

  const generateNarrative = (formatType: string) => {
    switch (formatType) {
      case "plain":
        return project.aggregates.map((aggregate) => aggregate.text).join(" ")

      case "numbered":
        return project.aggregates.map((aggregate, index) => `${index + 1}. ${aggregate.text}`).join("\n\n")

      case "detailed":
        return project.aggregates
          .map((aggregate, index) => {
            const transcriptName = transcriptMap[aggregate.transcriptId] || "Unknown"
            return `${index + 1}. [${transcriptName}]\n${aggregate.text}`
          })
          .join("\n\n")

      case "script":
        return project.aggregates
          .map((aggregate) => {
            const transcriptName = transcriptMap[aggregate.transcriptId] || "UNKNOWN"
            return `${transcriptName.toUpperCase()}: ${aggregate.text}`
          })
          .join("\n\n")

      default:
        return project.aggregates.map((aggregate) => aggregate.text).join(" ")
    }
  }

  const handleExport = () => {
    const narrative = generateNarrative(format)
    const blob = new Blob([narrative], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${project.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_narrative.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Narrative exported",
      description: "Your narrative has been downloaded as a text file.",
    })
    setOpen(false)
  }

  const handleCopy = () => {
    const narrative = generateNarrative(format)
    navigator.clipboard.writeText(narrative)
    toast({
      title: "Narrative copied",
      description: "Your narrative has been copied to clipboard.",
    })
  }

  const previewText = generateNarrative(format)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="font-space-grotesk">Export Narrative</DialogTitle>
          <DialogDescription>Choose your export format and preview your recomposed narrative.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-base font-medium">Export Format</Label>
            <RadioGroup value={format} onValueChange={setFormat} className="mt-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="plain" id="plain" />
                <Label htmlFor="plain">Plain Text - Continuous narrative</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="numbered" id="numbered" />
                <Label htmlFor="numbered">Numbered - Each aggregate numbered</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="detailed" id="detailed" />
                <Label htmlFor="detailed">Detailed - With source information</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="script" id="script" />
                <Label htmlFor="script">Script Format - Speaker labels</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label className="text-base font-medium">Preview</Label>
            <Textarea
              value={previewText}
              readOnly
              className="mt-2 h-64 font-mono text-sm"
              placeholder="Your narrative will appear here..."
            />
          </div>
        </div>

        <DialogFooter>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={handleCopy}>
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
            <Button onClick={handleExport} className="bg-primary hover:bg-primary/90">
              <Download className="h-4 w-4 mr-2" />
              Export File
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
