import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="panel max-w-md p-6 text-center">
        <h1 className="text-2xl font-bold">Page Not Found</h1>
        <p className="mt-2 text-sm text-muted">The page you requested does not exist.</p>
        <Link to="/" className="btn-primary mt-4 inline-flex">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

export default NotFoundPage;
