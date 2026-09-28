import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="space-y-2 text-center">
        <h1 className="text-xl font-semibold">Page not found</h1>
        <Link to="/employees" className="text-sm underline underline-offset-4">
          Go to the employee directory
        </Link>
      </div>
    </main>
  )
}
