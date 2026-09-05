import { ProductForm } from "@/components/admin/product-form";

export default function NewProductPage() {
  return (
    <div>
      <h1 className="mb-4 font-serif text-[24px]">添加商品</h1>
      <p className="mb-4 text-[13px] leading-5 text-[#777]">
        写名称、填价格、上传封面，再加几张详情长图即可保存。课节和文字大纲都在表单下方的「高级」里，不必现在填。
      </p>
      <ProductForm />
    </div>
  );
}
