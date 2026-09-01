import { ProductForm } from "@/components/admin/product-form";

export default function NewProductPage() {
  return (
    <div>
      <h1 className="mb-4 font-serif text-[24px]">新增课程</h1>
      <p className="mb-4 text-[13px] text-[#777]">基本信息与完整课程详情可一次填完，保存后会出现在前台商品页。</p>
      <ProductForm />
    </div>
  );
}
