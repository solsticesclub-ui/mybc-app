import { redirect } from "next/navigation";

export default function RootPage() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
    redirect("/app/demo/hub");
  }
  redirect("/onboarding");
}
