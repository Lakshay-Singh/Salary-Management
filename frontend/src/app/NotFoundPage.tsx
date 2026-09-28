import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="space-y-2 text-center">
        <h1>Page not found</h1>
        <Link to="/employees" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
          Go to the employee directory
        </Link>
      </div>
    </main>
  )
}
