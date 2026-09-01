import { SimplePlaceholder } from "@/components/simple-page";
import { brand, placeholderPages } from "@/lib/data";

export default function AboutPage() {
  const page = placeholderPages.about;
  return (
    <SimplePlaceholder
      title={page.title}
      body={`${page.body} ${brand.mottoWay}。`}
      actions={[{ href: "/", label: "回到首页" }]}
    />
  );
}
