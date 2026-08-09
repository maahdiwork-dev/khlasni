import { redirect } from "next/navigation";

// Placeholder root — the landing-page module (app/(modules)/home) replaces this.
export default function Home() {
  redirect("/dashboard");
}
