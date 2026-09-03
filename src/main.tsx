import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { client, unwrap } from '@/lib/api'
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

const queryClient = new QueryClient()

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <HomePage />, loader: () => unwrap(client.api.home.get()) },
      { path: 'build', element: <BuilderPage /> },
      { path: 'drafts', element: <DraftsPage /> },
      {
        path: 'builds',
        element: <BuildsPage />,
        loader: ({ request }) => unwrap(client.api.builds.get({ query: { sort: q(request, 'sort') ?? 'new' } })),
      },
      { path: 'builds/:id', element: <BuildPage />, loader: ({ params }) => unwrap(client.api.builds({ id: params.id! }).get()) },
      {
        path: 'forum',
        element: <ForumPage />,
        loader: ({ request }) => {
          const category = q(request, 'category')
          return unwrap(client.api.forum.threads.get({ query: category ? { category } : {} }))
        },
      },
      { path: 'forum/new', element: <NewThreadPage /> },
      { path: 'forum/:id', element: <ThreadPage />, loader: ({ params }) => unwrap(client.api.forum.threads({ id: params.id! }).get()) },
      { path: 'u/:id', element: <ProfilePage />, loader: ({ params }) => unwrap(client.api.users({ id: params.id! }).get()) },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'signup', element: <SignupPage /> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
