import { useNavigate } from 'react-router'
import { LibraryGrid } from '@/components/library/LibraryGrid'
import { PageHeader } from '@/components/site/PageBits'

export function DraftsPage() {
  const navigate = useNavigate()
  return (
    <div>
      <PageHeader title="Drafts" jp="下書き" blurb="Builds saved in this browser. Load one to keep working, or publish it from the build sheet." />
      <LibraryGrid onLoad={() => navigate('/build')} />
    </div>
  )
}
