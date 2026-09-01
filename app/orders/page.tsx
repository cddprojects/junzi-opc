import { SimplePlaceholder } from "@/components/simple-page";
import { placeholderPages } from "@/lib/data";

export default function OrdersPage() {
  const page = placeholderPages.orders;
  return (
    <SimplePlaceholder
      title={page.title}
      body={page.body}
      actions={[
        { href: "/product/qihang", label: "查看启航营" },
        { href: "/categories", label: "浏览商品分类" },
      ]}
    />
  );
}
