"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function FeedbackPage() {
  return (
    <form
      className="px-4 py-6"
      onSubmit={(event) => {
        event.preventDefault();
        toast("演示站不提交反馈");
      }}
    >
      <div className="rounded-lg bg-white px-4 py-5">
        <h2 className="text-[17px] font-semibold">用户反馈</h2>
        <p className="mt-2 text-[13px] text-[#666]">内容不会发送到原小程序或任何服务器。</p>
        <Input className="mt-4 h-10" placeholder="一句话说明你的建议" name="note" />
        <Button type="submit" className="mt-4 w-full bg-[#8a5a20] text-white hover:bg-[#6f4818]">
          提交（演示）
        </Button>
      </div>
    </form>
  );
}
