import { SimplePlaceholder } from "@/components/simple-page";

export default function GuideAiPage() {
  return (
    <SimplePlaceholder
      title="操作指南二（必看）· 未更新"
      body="本页对应「君子小雅AI工具小程序 操作指南二」。内容尚未更新，这里仅保留入口，方便对照原小程序信息架构。"
      actions={[
        { href: "/tools", label: "打开 AI 工具占位页" },
        { href: "/guides", label: "返回指南列表" },
      ]}
    />
  );
}
