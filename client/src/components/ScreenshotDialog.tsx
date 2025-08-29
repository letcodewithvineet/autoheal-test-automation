import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X, Download, RotateCw } from "lucide-react"
import { useState } from "react"

interface ScreenshotDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  screenshotPath: string | null
  failureId: string
  testName: string
  onRetryScreenshot?: () => void
  isRetrying?: boolean
}

export function ScreenshotDialog({
  open,
  onOpenChange,
  screenshotPath,
  failureId,
  testName,
  onRetryScreenshot,
  isRetrying = false
}: ScreenshotDialogProps) {
  const [imageLoading, setImageLoading] = useState(true)

  const handleImageLoad = () => {
    setImageLoading(false)
  }

  const handleImageError = () => {
    setImageLoading(false)
  }

  const handleDownload = () => {
    if (screenshotPath) {
      const link = document.createElement('a')
      link.href = `/api${screenshotPath}`
      link.download = `screenshot-${failureId}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[95vw] max-h-[95vh] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b bg-background">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">
              Screenshot - {testName}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {onRetryScreenshot && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRetryScreenshot}
                  disabled={isRetrying}
                  data-testid="button-retry-screenshot-dialog"
                >
                  {isRetrying ? (
                    <>
                      <RotateCw className="w-4 h-4 mr-2 animate-spin" />
                      Capturing...
                    </>
                  ) : (
                    <>
                      <RotateCw className="w-4 h-4 mr-2" />
                      Retry Screenshot
                    </>
                  )}
                </Button>
              )}
              {screenshotPath && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  data-testid="button-download-screenshot"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                data-testid="button-close-screenshot-dialog"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 p-6 overflow-auto bg-gray-50 dark:bg-gray-900">
          {screenshotPath ? (
            <div className="flex justify-center">
              <div className="relative max-w-full">
                {imageLoading && (
                  <div className="flex items-center justify-center h-64 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <div className="text-gray-500">Loading screenshot...</div>
                  </div>
                )}
                <img
                  src={`/api${screenshotPath}`}
                  alt="Test failure screenshot"
                  className={`max-w-full h-auto rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 ${
                    imageLoading ? 'hidden' : 'block'
                  }`}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  data-testid="img-screenshot-fullsize"
                />
                {!imageLoading && (
                  <div className="mt-4 text-center text-sm text-gray-500">
                    Click and drag to pan • Use mouse wheel to zoom
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <div className="text-center">
                <div className="text-gray-500 mb-4">No screenshot available</div>
                {onRetryScreenshot && (
                  <Button
                    variant="outline"
                    onClick={onRetryScreenshot}
                    disabled={isRetrying}
                    data-testid="button-retry-no-screenshot"
                  >
                    {isRetrying ? (
                      <>
                        <RotateCw className="w-4 h-4 mr-2 animate-spin" />
                        Capturing...
                      </>
                    ) : (
                      <>
                        <RotateCw className="w-4 h-4 mr-2" />
                        Capture Screenshot
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}