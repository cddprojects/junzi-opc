# 君子小雅OPC

君子小雅OPC研习社（一人公司）课程网站。桌面端是宽屏店面（顶栏导航、多列商品）；手机端是普通网站头和底栏，不是小程序窗口。

收款走 **Billplz**（FPX / 银行卡）。Billplz 只收令吉（MYR）：前台仍可按 CNY / MYR / USD / SGD 浏览标价，下单时按后台汇率折成 RM 再创建账单。

前台与后台共用同一套字体：**Noto Sans SC**（正文、导航、按钮，约 14px）和 **Noto Serif SC**（标题、品牌、价格）。中英文都走这套，不再用 Geist / Inter。

推荐分销：注册可选填推荐码（填了就锁定推荐人）。每位学员自动获得推荐码。好友用该码注册并在 **Billplz 付款成功** 后，按实收令吉计提佣金，默认三级 **10% / 5% / 2%**（后台可改）。后台授权课、演示支付、未付款账单会增加订单数，但**默认不计佣**。测试时可在「佣金 / 提现」或学员订单上点「补计提」，或授权时勾选「按实收计佣」——不会改成生产自动计佣。学员端只看到这 3 级；后台族谱可看完整上下级，第 4 级及更上不计佣。压缩默认关闭。佣金进余额，提现由后台人工结算，不会即时打到银行。后台「佣金 / 提现」会单独列出已支付但未计提的订单（授权 / 演示 / 前 3 级无可发上级）。

## 本地运行

需要 Node.js 18 或更新版本。

```bash
cp .env.example .env.local
npm install
npm run dev
```

开发服务器监听 `0.0.0.0:43180`。在这台云端虚拟机上，用 [http://127.0.0.1:43180](http://127.0.0.1:43180) 或对话里的 Preview 打开。

如果你在自己电脑的 Cursor 内置浏览器里打开 `http://127.0.0.1:43180`，会连不上（站点不可达），那是因为应用跑在云端虚拟机上，不是你的笔记本。请用对话中的 Preview / agent 桌面，不要用本机 Simple Browser。这和后台登录是否坏掉不是同一件事。

生产构建：

```bash
npm run build
npm start
```

## Billplz 收款

1. 在 [Billplz 生产环境](https://www.billplz.com/) 注册并创建一个 Collection（正式收款走生产，这是默认路径）。需要联调时才用沙盒 [billplz-sandbox.com](https://www.billplz-sandbox.com/)。
2. 打开 Settings → Keys & Integration，复制 Secret Key，并启用 **X Signature Payment Completion**，保存 X Signature Key。
3. 在环境变量中填写：

| 变量 | 说明 |
| --- | --- |
| `BILLPLZ_API_KEY` | Secret Key，只放在服务器，不要写进前端 |
| `BILLPLZ_COLLECTION_ID` | 收款 Collection ID |
| `BILLPLZ_X_SIGNATURE_KEY` | 用于校验 callback / redirect 的 HMAC-SHA256 密钥 |
| `BILLPLZ_SANDBOX` | 可选。未设置或 `false` 使用生产 `www.billplz.com`。只有测试时才设 `true`（`www.billplz-sandbox.com`） |
| `NEXT_PUBLIC_APP_URL` | 站点绝对地址，例如 `https://your-domain.com`。用于 `callback_url` 与 `redirect_url` |
| `ALLOW_DEMO_PAY` | 仅离线调试。默认关闭。设为 `true` 且未配置 Billplz 时，才允许不跳转网关直接发课程码 |

在后台 [/admin/billplz](http://127.0.0.1:43180/admin/billplz)（「Billplz 支付配置」）粘贴三项密钥并保存。会写入本机 `.env.local`（已 gitignore），结算立即读取，不必手改文件。不要把真实密钥提交到 git，也不要贴进聊天。

4. 登录学员账号后结算：服务端按汇率把商品折成 **sen**（RM 分），`POST /api/v3/bills` 建单，再跳转到返回的账单页。
5. Billplz 会：
   - `POST /api/billplz/callback`：校验 `x_signature`，已支付则发课程码、解锁课程（重复回调不会重复履约）
   - `GET /pay/return`：回跳页同样校验签名，显示成功或处理中，并链到学习订单

未配置上述密钥时，结算会明确提示先配置 Billplz，不会出现假的支付弹窗。

**Billplz 的 callback 到不了 localhost。** 当前预览若把 `NEXT_PUBLIC_APP_URL` 设为 `http://127.0.0.1:43180`，可以在本机跳转支付页，但 Billplz 服务器无法回调这台机器，付款后的自动履约（发课程码、解锁）不会发生。正式收款需要公网 HTTPS 地址（或隧道，例如 Cloudflare Tunnel / ngrok）再改 `NEXT_PUBLIC_APP_URL`。回跳页 `/pay/return` 在签名有效且 `paid=true` 时仍会履约。

## 学员账号

- 注册 / 登录：`/register`、`/login`（邮箱或手机号 + 密码）
- 游客可浏览课程；购买和「我的学习」需要登录
- **付款前请在资料里填写邮箱**（Billplz 建单需要 email）
- 每位学员只看到自己的订单、学习记录、会员状态和课程码
- 前台账号与 `/admin` 后台密码分开

## 课程码

Billplz 确认付款后会为该用户生成一枚可核验的加密课程码，并写入「学习订单」「我的学习」。

- 算法：HMAC-SHA256（用户 ID + 课程 + 订单 ID），再编码为 `JX-XXXX-XXXX-XXXX-XXXX`
- 前台核对：[/verify](http://127.0.0.1:43180/verify)
- 后台核对：[/admin/orders](http://127.0.0.1:43180/admin/orders)（显示完整学员信息、Billplz 账单号与支付状态）
- 可选环境变量 `VERIFY_SECRET`；未设置时使用 `data/store.json` 里生成的密钥

## 管理后台

地址：[http://127.0.0.1:43180/admin](http://127.0.0.1:43180/admin)

- 默认密码：`junzi-admin`（仅供本地演示）
- 正式环境请设置环境变量 `ADMIN_PASSWORD`
- 可增删改：商品/课程、海报轮播、视频
- 添加商品默认很简单：名称、价格、封面、详情图（一张或多张长图）。课节、直播、文字大纲收在「高级 / 课节与大纲」，新商品不必填
- 前台有详情图时，商品页按长图竖着铺满；没有详情图且已有课节/大纲时，仍显示原来的结构化详情
- 课节视频功能还在，只是不再作为默认填写路径
- 学员账号：搜索、改资料、停用/启用、重设密码、授权/撤销课程与课程码
- 货币与汇率：默认货币 + 对人民币汇率（前台 CNY / MYR / USD / SGD 切换；**扣款货币始终是 MYR**）
- 语言：前台与后台可切换中文 / English（cookie `opc_locale`，默认中文）
- 支持上传封面图、详情长图、海报图和视频文件
- 前台 `/product/[slug]`：有详情图就展示图片；否则按结构化课程详情渲染

数据文件：

| 路径 | 说明 |
| --- | --- |
| `data/store.json` | 商品、海报、视频、用户、会话、订单 |
| `data/uploads/` | 上传的图片和视频，通过 `/uploads/文件名` 访问 |

种子文案仍在 [`lib/data.ts`](lib/data.ts)，只在还没有 `store.json` 时写入。

## 主要页面

| 路径 | 说明 |
| --- | --- |
| `/` | 首页 |
| `/categories` | 商品分类 |
| `/mine` | 我的（登录后显示本账号） |
| `/login` `/register` | 登录 / 注册 |
| `/orders` | 订单列表（学习订单） |
| `/orders/[id]` | 订单详情与卡密（加密课程码） |
| `/pay/return` | Billplz 回跳：成功 / 处理中 |
| `/learning` | 我的学习 |
| `/verify` | 验证课程码 |
| `/product/[slug]` | 商品详情（详情图或结构化大纲） |
| `/courses/recorded` | 线上录播课（正课课节） |
| `/courses/recorded/[slug]` | 某门课的正课目录 |
| `/courses/recorded/[slug]/[n]` | 第 n 节播放（需已购或管理员） |
| `/admin` | 管理后台 |
| `/admin/users` | 学员账号 |
| `/admin/currency` | 货币与汇率 |
| `/admin/orders` | 订单、课程码、Billplz 账单号 |

手机底栏为「首页 / 分类 / 我的」。桌面用顶部导航。页头可切换货币（CNY / MYR / USD / SGD）和语言（中文 / English），选择会写入 cookie，不会退出登录或清空购物车。商品以人民币入库，按后台汇率折算展示。Billplz 实收始终为令吉。卡密、价格与 slug 不随语言改变。

## 英文文案

界面按钮、导航、空状态等写在 [`lib/messages.ts`](lib/messages.ts)。

商品、课节、海报等目录内容**不走在线翻译**。在后台对应表单填写英文（选填）：

| 位置 | 字段 |
| --- | --- |
| 商品 / 课程 | 标题、短标题、副标题、赠送说明，以及高级区里的介绍、课节标题等 |
| 海报 / 轮播 | 标题、副标题、角标、价格文案 |
| 视频 | 标题、封面叠字 |

前台选 English 时：英文有内容就显示英文；空着则回退中文，不会留白。只填了中文的商品会继续显示中文。

分类标签（录播课、OPC研习社等）已预置英文。种子目录（启航营、实战营、算力加餐、课节等）也已写入英文，在还没有 `store.json` 或升级到 store version 7 时合并进去。已有后台改过的中文不会被覆盖。

## 说明

- 未上传视频时使用占位封面，不复制原片。
- 购物车只存在当前浏览器会话。
- 不要把 `ADMIN_PASSWORD`、`VERIFY_SECRET`、`BILLPLZ_API_KEY`、`BILLPLZ_X_SIGNATURE_KEY` 或 `data/store.json` 提交到公开仓库。
