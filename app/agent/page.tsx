import { SimplePlaceholder } from "@/components/simple-page";
import { placeholderPages } from "@/lib/data";

export default function AgentPage() {
  const page = placeholderPages.agent;
  return <SimplePlaceholder title={page.title} body={page.body} />;
}
