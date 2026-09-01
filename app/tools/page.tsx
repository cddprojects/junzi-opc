import { AiToolBanner } from "@/components/covers";
import { SimplePlaceholder } from "@/components/simple-page";
import { placeholderPages } from "@/lib/data";

export default function ToolsPage() {
  const page = placeholderPages.tools;
  return (
    <div>
      <div className="px-3 pt-3">
        <AiToolBanner />
      </div>
      <SimplePlaceholder
        title={page.title}
        body={page.body}
        actions={[
          { href: "/guides/ai", label: "查看操作指南二" },
          { href: "/product/compute", label: "算力加餐包" },
        ]}
      />
    </div>
  );
}
