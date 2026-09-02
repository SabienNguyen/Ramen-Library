import { useNavigate } from 'react-router'
import { LibraryGrid } from '@/components/library/LibraryGrid'
import { PageHeader } from '@/components/site/PageBits'

export function DraftsPage() {
  const navigate = useNavigate()
  return (
    <div>
      <PageHeader title="Drafts" blurb="Saved in this browser only." />
      <LibraryGrid onLoad={() => navigate('/build')} />
    </div>
  )
}
