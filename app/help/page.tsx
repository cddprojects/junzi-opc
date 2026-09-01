import { SimplePlaceholder } from "@/components/simple-page";
import { placeholderPages } from "@/lib/data";

export default function HelpPage() {
  const page = placeholderPages.help;
  return (
    <SimplePlaceholder
      title={page.title}
      body={page.body}
      actions={[{ href: "/guides", label: "打开操作指南" }]}
    />
  );
}
