import { Link } from "react-router-dom";
import { Icon, LogoMark, usePageTitle } from "../components/ui";

export default function NotFound() {
  usePageTitle("Page not found");
  return (
    <div className="grid place-items-center py-24 text-center">
      <LogoMark className="mb-6 h-16" />
      <p className="label mb-2">404</p>
      <h1 className="mb-6 text-4xl font-semibold">This road is closed</h1>
      <Link to="/" className="btn btn-primary"><Icon name="back" /> Back to the home page</Link>
    </div>
  );
}
