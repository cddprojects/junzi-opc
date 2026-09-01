import { SimplePlaceholder } from "@/components/simple-page";

export default function NotFound() {
  return (
    <SimplePlaceholder
      title="页面不存在"
      body="没有找到该页面。可以从首页、分类或我的继续浏览。"
      actions={[{ href: "/", label: "回到首页" }]}
    />
  );
}
