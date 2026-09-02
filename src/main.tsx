import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { api } from '@/lib/api'
import { Layout } from '@/components/site/Layout'
import { ErrorPage } from '@/components/site/PageBits'
import { LoginPage, SignupPage } from '@/pages/AuthPages'
import { BuildPage } from '@/pages/BuildPage'
import { BuilderPage } from '@/pages/BuilderPage'
import { BuildsPage } from '@/pages/BuildsPage'
import { DraftsPage } from '@/pages/DraftsPage'
import { ForumPage, NewThreadPage, ThreadPage } from '@/pages/ForumPages'
import { HomePage } from '@/pages/HomePage'
import { ProfilePage, SettingsPage } from '@/pages/ProfilePage'
import './index.css'

const q = (request: Request, key: string) => new URL(request.url).searchParams.get(key)

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <HomePage />, loader: () => api('/home') },
      { path: 'build', element: <BuilderPage /> },
      { path: 'drafts', element: <DraftsPage /> },
      { path: 'builds', element: <BuildsPage />, loader: ({ request }) => api(`/builds?sort=${q(request, 'sort') ?? 'new'}`) },
      { path: 'builds/:id', element: <BuildPage />, loader: ({ params }) => api(`/builds/${params.id}`) },
      { path: 'forum', element: <ForumPage />, loader: ({ request }) => api(`/forum/threads${q(request, 'category') ? `?category=${q(request, 'category')}` : ''}`) },
      { path: 'forum/new', element: <NewThreadPage /> },
      { path: 'forum/:id', element: <ThreadPage />, loader: ({ params }) => api(`/forum/threads/${params.id}`) },
      { path: 'u/:id', element: <ProfilePage />, loader: ({ params }) => api(`/users/${params.id}`) },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'signup', element: <SignupPage /> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
