import { useState } from 'react'
import { AccessibilityIndicator } from './AccessibilityIndicator'
import { AccessibilityPanel } from './AccessibilityPanel'
import { Tooltip } from './Tooltip'
import { useAccessibilitySettingsContext } from '../contexts/AccessibilitySettingsContext'

/** Renders accessibility indicator + panel globally on all pages (incl. login/signup). */
export function GlobalAccessibility() {
  const { activeCount } = useAccessibilitySettingsContext()
  const [showAccessibilityPanel, setShowAccessibilityPanel] = useState(false)

  return (
    <>
      <div className="fixed bottom-4 right-4 z-40">
        <Tooltip content="Click here for accessibility">
          <div>
            <AccessibilityIndicator
              activeCount={activeCount}
              onClick={() => setShowAccessibilityPanel(true)}
            />
          </div>
        </Tooltip>
      </div>
      <AccessibilityPanel
        isOpen={showAccessibilityPanel}
        onClose={() => setShowAccessibilityPanel(false)}
      />
    </>
  )
}
