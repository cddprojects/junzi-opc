import { SimplePlaceholder } from "@/components/simple-page";

export default function GuideOpcPage() {
  return (
    <SimplePlaceholder
      title="操作指南一（必看）· 更新中"
      body="本页对应「君子小雅OPC研习社小程序 操作指南一」。演示站使用图文占位，不提供原视频文件。建议先从首页熟悉录播课、分类与「我的」三个入口。"
      actions={[
        { href: "/", label: "返回首页" },
        { href: "/courses/recorded", label: "查看录播课" },
      ]}
    />
  );
}
