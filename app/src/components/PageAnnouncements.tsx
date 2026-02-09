import { usePageAnnouncements } from '../hooks/usePageAnnouncements'

/** Component that announces page changes when voice guide is enabled. */
export function PageAnnouncements() {
  usePageAnnouncements()
  return null
}
