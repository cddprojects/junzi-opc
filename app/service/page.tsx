import { SimplePlaceholder } from "@/components/simple-page";
import { placeholderPages } from "@/lib/data";

export default function ServicePage() {
  const page = placeholderPages.service;
  return (
    <SimplePlaceholder
      title={page.title}
      body={page.body}
      actions={[{ href: "/help", label: "查看帮助中心" }]}
    />
  );
}
