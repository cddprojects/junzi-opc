import { demoUser, placeholderPages } from "@/lib/data";
import { SimplePlaceholder } from "@/components/simple-page";

export default function ProfilePage() {
  const page = placeholderPages.profile;
  return (
    <div>
      <div className="mx-3 mt-3 rounded-lg bg-white px-4 py-4 text-[14px]">
        <p>
          昵称 <span className="float-right text-[#888]">{demoUser.name}</span>
        </p>
        <p className="mt-3 border-t border-[#f2f2f2] pt-3">
          手机 <span className="float-right text-[#888]">{demoUser.phone}</span>
        </p>
      </div>
      <SimplePlaceholder title={page.title} body={page.body} />
    </div>
  );
}
