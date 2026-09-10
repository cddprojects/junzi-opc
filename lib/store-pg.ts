import "server-only";

import type { Customer, Order, UserSession } from "@/lib/account";
import type { CatalogVideo, Poster, Product } from "@/lib/data";
import { asFiniteNumber, asIso, asOptionalNumber, getSql, requireIso, withStoreTx } from "@/lib/db";
import { hydrateOrderFromPayment, hydrateTopUpFromPayment } from "@/lib/migrate-payments";
import type { BillplzBill, Payment } from "@/lib/payments";
import type { CommissionEntry, ReferralPlan, Withdrawal } from "@/lib/referral";
import type { AppStore } from "@/lib/store";
import type { TopUpRecord, WalletTransaction } from "@/lib/wallet";
import { normalizeWithdrawalStatus } from "@/lib/wallet";

function text(value: unknown) {
  return value == null ? undefined : String(value);
}

function mapUser(row: Record<string, unknown>): Customer {
  return {
    id: String(row.id),
    name: String(row.name),
    email: text(row.email),
    phone: text(row.phone),
    passwordSalt: String(row.password_salt),
    passwordHash: String(row.password_hash),
    createdAt: requireIso(row.created_at),
    memberUntil: asIso(row.member_until),
    status: row.status === "disabled" ? "disabled" : "active",
    referralCode: text(row.referral_code),
    referrerId: text(row.referrer_id),
    commissionBalanceSen: asFiniteNumber(row.commission_balance_sen),
    topUpBalanceSen: asFiniteNumber(row.topup_balance_sen),
  };
}

function mapSession(row: Record<string, unknown>): UserSession {
  return {
    tokenHash: String(row.token_hash),
    userId: String(row.user_id),
    expiresAt: requireIso(row.expires_at),
  };
}

function mapProduct(row: Record<string, unknown>): Product {
  return {
    slug: String(row.slug),
    title: String(row.title),
    titleEn: text(row.title_en),
    shortTitle: String(row.short_title || row.title),
    shortTitleEn: text(row.short_title_en),
    price: asFiniteNumber(row.price_cny),
    originalPrice: asOptionalNumber(row.original_price_cny),
    sales: asFiniteNumber(row.sales),
    categoryId: row.category_id === "compute" ? "compute" : "opc",
    cover: String(row.cover) as Product["cover"],
    href: String(row.href),
    subtitle: text(row.subtitle),
    subtitleEn: text(row.subtitle_en),
    giftNote: text(row.gift_note),
    giftNoteEn: text(row.gift_note_en),
    description: text(row.description),
    descriptionEn: text(row.description_en),
    outline: text(row.outline),
    outlineEn: text(row.outline_en),
    coverImage: text(row.cover_image),
    detailImages: Array.isArray(row.detail_images) ? (row.detail_images as string[]) : undefined,
    detail: (row.detail as Product["detail"]) || undefined,
  };
}

function mapPoster(row: Record<string, unknown>): Poster {
  return {
    id: String(row.id),
    title: String(row.title),
    titleEn: text(row.title_en),
    href: String(row.href),
    sort: asFiniteNumber(row.sort),
    placement: row.placement === "home-banner" ? "home-banner" : "home-carousel",
    image: text(row.image),
    subtitle: text(row.subtitle),
    subtitleEn: text(row.subtitle_en),
    kicker: text(row.kicker),
    kickerEn: text(row.kicker_en),
    priceLabel: text(row.price_label),
    priceLabelEn: text(row.price_label_en),
    theme: text(row.theme) as Poster["theme"],
  };
}

function mapVideo(row: Record<string, unknown>): CatalogVideo {
  return {
    id: String(row.id),
    title: String(row.title),
    titleEn: text(row.title_en),
    poster: text(row.poster),
    videoUrl: text(row.video_url),
    duration: text(row.duration),
    productSlug: text(row.product_slug),
    overlay: text(row.overlay),
    overlayEn: text(row.overlay_en),
    placement: String(row.placement) as CatalogVideo["placement"],
  };
}

function mapPayment(row: Record<string, unknown>): Payment {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    kind: row.kind as Payment["kind"],
    provider: row.provider as Payment["provider"],
    status: row.status as Payment["status"],
    amountSen: asFiniteNumber(row.amount_sen),
    checkoutId: text(row.checkout_id),
    createdAt: requireIso(row.created_at),
    paidAt: asIso(row.paid_at),
    cancelledAt: asIso(row.cancelled_at),
    note: text(row.note),
    expectedAmountSen: asOptionalNumber(row.expected_amount_sen),
    receivedAmountSen: row.received_amount_sen == null ? undefined : asFiniteNumber(row.received_amount_sen),
    mismatchBillplzBillId: text(row.mismatch_billplz_bill_id),
    callbackReceivedAt: asIso(row.callback_received_at),
  };
}

function mapBill(row: Record<string, unknown>): BillplzBill {
  return {
    id: String(row.id),
    paymentId: String(row.payment_id),
    url: text(row.url),
    collectionId: text(row.collection_id),
    amountSen: asFiniteNumber(row.amount_sen),
    status: row.status as BillplzBill["status"],
    paidAt: asIso(row.paid_at),
    lastCallbackAt: asIso(row.last_callback_at),
    createdAt: requireIso(row.created_at),
  };
}

function mapOrder(row: Record<string, unknown>): Order {
  return {
    id: String(row.id),
    orderNo: String(row.order_no),
    userId: String(row.user_id),
    paymentId: String(row.payment_id),
    checkoutId: String(row.checkout_id),
    productSlug: String(row.product_slug),
    productTitle: String(row.product_title),
    price: asFiniteNumber(row.price),
    priceCny: asFiniteNumber(row.price_cny),
    currency: text(row.currency),
    qty: asFiniteNumber(row.qty, 1),
    createdAt: requireIso(row.created_at),
    verifyCode: text(row.verify_code),
    status: row.status === "pending" ? "pending" : "paid",
    paidAt: asIso(row.paid_at),
    payMethod: text(row.pay_method) as Order["payMethod"],
    amountMyr: asOptionalNumber(row.amount_myr),
    amountSen: asFiniteNumber(row.amount_sen),
    referralSettled: (row.referral_settled as Order["referralSettled"]) || undefined,
    referralSkip: (row.referral_skip as Order["referralSkip"]) || undefined,
  };
}

function mapLedger(row: Record<string, unknown>): CommissionEntry {
  return {
    id: String(row.id),
    kind: row.kind as CommissionEntry["kind"],
    userId: text(row.user_id) || "",
    orderId: text(row.order_id),
    buyerId: text(row.buyer_id),
    buyerName: text(row.buyer_name),
    tier: asOptionalNumber(row.tier) as CommissionEntry["tier"],
    ratePercent: asOptionalNumber(row.rate_percent),
    payoutType: text(row.payout_type) as CommissionEntry["payoutType"],
    fixedSen: asOptionalNumber(row.fixed_sen),
    baseSen: asOptionalNumber(row.base_sen),
    amountSen: asFiniteNumber(row.amount_sen),
    paid: Boolean(row.paid),
    reason: text(row.reason),
    createdAt: requireIso(row.created_at),
    note: text(row.note),
    relationshipSnapshot: (row.relationship_snapshot as CommissionEntry["relationshipSnapshot"]) || undefined,
  };
}

function mapWalletTx(row: Record<string, unknown>): WalletTransaction {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    amountSen: asFiniteNumber(row.amount_sen),
    bucket: row.bucket as WalletTransaction["bucket"],
    kind: row.kind as WalletTransaction["kind"],
    sourceType: String(row.source_type),
    sourceId: String(row.source_id),
    note: text(row.note),
    createdAt: requireIso(row.created_at),
    balanceAfterSen: asFiniteNumber(row.balance_after_sen),
  };
}

function mapWithdrawal(row: Record<string, unknown>): Withdrawal {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    amountSen: asFiniteNumber(row.amount_sen),
    status: normalizeWithdrawalStatus(String(row.status)),
    createdAt: requireIso(row.created_at),
    approvedAt: asIso(row.approved_at),
    paidAt: asIso(row.paid_at),
    rejectedAt: asIso(row.rejected_at),
    settledAt: asIso(row.settled_at),
    note: text(row.note),
    payout:
      row.payout_bank || row.payout_holder || row.payout_account
        ? {
            bank: String(row.payout_bank || ""),
            holder: String(row.payout_holder || ""),
            account: String(row.payout_account || ""),
          }
        : undefined,
  };
}

function mapTopUp(row: Record<string, unknown>): TopUpRecord {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    paymentId: String(row.payment_id),
    amountSen: asFiniteNumber(row.amount_sen),
    status: row.status as TopUpRecord["status"],
    createdAt: requireIso(row.created_at),
    creditedAt: asIso(row.credited_at),
    note: text(row.note),
  };
}

export async function loadAppStoreFromPg(): Promise<AppStore> {
  const sql = getSql();
  const [
    users,
    sessions,
    products,
    posters,
    videos,
    settingsRows,
    planRows,
    payments,
    bills,
    orders,
    ledger,
    walletTx,
    withdrawals,
    topUps,
  ] = await Promise.all([
    sql<Record<string, unknown>[]>`select * from users`,
    sql<Record<string, unknown>[]>`select * from sessions`,
    sql<Record<string, unknown>[]>`select * from products`,
    sql<Record<string, unknown>[]>`select * from posters`,
    sql<Record<string, unknown>[]>`select * from videos`,
    sql<Record<string, unknown>[]>`select * from settings where id = 1`,
    sql<Record<string, unknown>[]>`select * from referral_plan where id = 1`,
    sql<Record<string, unknown>[]>`select * from payments`,
    sql<Record<string, unknown>[]>`select * from billplz_bills`,
    sql<Record<string, unknown>[]>`select * from orders`,
    sql<Record<string, unknown>[]>`select * from commission_ledger`,
    sql<Record<string, unknown>[]>`select * from wallet_transactions`,
    sql<Record<string, unknown>[]>`select * from withdrawals`,
    sql<Record<string, unknown>[]>`select * from top_ups`,
  ]);

  const paymentRows = payments.map(mapPayment);
  const billRows = bills.map(mapBill);
  const mappedOrders = orders.map((row) => hydrateOrderFromPayment(mapOrder(row), paymentRows, billRows));
  const mappedTopUps = topUps.map((row) => hydrateTopUpFromPayment(mapTopUp(row), billRows));

  const settingsRow = settingsRows[0];
  const planRow = planRows[0];

  return {
    version: 13,
    products: products.map(mapProduct),
    posters: posters.map(mapPoster),
    videos: videos.map(mapVideo),
    users: users.map(mapUser),
    sessions: sessions.map(mapSession),
    orders: mappedOrders,
    payments: paymentRows,
    billplzBills: billRows,
    verifySecret: "",
    settings: {
      defaultCurrency: (settingsRow?.default_currency as "CNY") || "CNY",
      fx: (settingsRow?.fx as AppStore["settings"]["fx"]) || { CNY: 1, MYR: 1.64, USD: 7.2, SGD: 5.3 },
    },
    referralPlan: (planRow
      ? {
          compression: Boolean(planRow.compression),
          maxPayoutSen: planRow.max_payout_sen == null ? null : asFiniteNumber(planRow.max_payout_sen),
          tiers: planRow.tiers as ReferralPlan["tiers"],
        }
      : undefined) as AppStore["referralPlan"],
    commissionLedger: ledger.map(mapLedger),
    withdrawals: withdrawals.map(mapWithdrawal),
    walletTransactions: walletTx.map(mapWalletTx),
    topUps: mappedTopUps,
  };
}

function ids(rows: { id?: string; slug?: string }[]) {
  return rows.map((row) => row.id || row.slug).filter(Boolean) as string[];
}

export async function persistAppStoreToPg(store: AppStore) {
  await withStoreTx(async (sql) => {
    const userBase = store.users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email || null,
      phone: user.phone || null,
      password_salt: user.passwordSalt,
      password_hash: user.passwordHash,
      created_at: user.createdAt,
      member_until: user.memberUntil || null,
      status: user.status === "disabled" ? "disabled" : "active",
      referral_code: user.referralCode || null,
      referrer_id: null as string | null,
      commission_balance_sen: user.commissionBalanceSen || 0,
      topup_balance_sen: user.topUpBalanceSen || 0,
    }));
    if (userBase.length) {
      await sql`
        insert into users ${sql(userBase)}
        on conflict (id) do update set
          name = excluded.name,
          email = excluded.email,
          phone = excluded.phone,
          password_salt = excluded.password_salt,
          password_hash = excluded.password_hash,
          created_at = excluded.created_at,
          member_until = excluded.member_until,
          status = excluded.status,
          referral_code = excluded.referral_code,
          commission_balance_sen = excluded.commission_balance_sen,
          topup_balance_sen = excluded.topup_balance_sen
      `;
    }
    for (const user of store.users) {
      await sql`update users set referrer_id = ${user.referrerId || null} where id = ${user.id}`;
    }

    const sessionRows = store.sessions.map((session) => ({
      id: `ses_${session.tokenHash.slice(0, 16)}`,
      user_id: session.userId,
      token_hash: session.tokenHash,
      expires_at: session.expiresAt,
      created_at: new Date().toISOString(),
    }));
    await sql`delete from sessions`;
    if (sessionRows.length) {
      await sql`insert into sessions ${sql(sessionRows)} on conflict (id) do update set
        user_id = excluded.user_id,
        token_hash = excluded.token_hash,
        expires_at = excluded.expires_at`;
    }

    const productRows = store.products.map((product) => ({
      slug: product.slug,
      title: product.title,
      title_en: product.titleEn || null,
      short_title: product.shortTitle || product.title,
      short_title_en: product.shortTitleEn || null,
      price_cny: product.price,
      original_price_cny: product.originalPrice ?? null,
      sales: product.sales || 0,
      category_id: product.categoryId,
      cover: product.cover,
      href: product.href,
      subtitle: product.subtitle || null,
      subtitle_en: product.subtitleEn || null,
      gift_note: product.giftNote || null,
      gift_note_en: product.giftNoteEn || null,
      description: product.description || null,
      description_en: product.descriptionEn || null,
      outline: product.outline || null,
      outline_en: product.outlineEn || null,
      cover_image: product.coverImage || null,
      detail_images: product.detailImages || null,
      detail: product.detail ? sql.json(product.detail) : null,
    }));
    if (productRows.length) {
      await sql`
        insert into products ${sql(productRows)}
        on conflict (slug) do update set
          title = excluded.title,
          title_en = excluded.title_en,
          short_title = excluded.short_title,
          short_title_en = excluded.short_title_en,
          price_cny = excluded.price_cny,
          original_price_cny = excluded.original_price_cny,
          sales = excluded.sales,
          category_id = excluded.category_id,
          cover = excluded.cover,
          href = excluded.href,
          subtitle = excluded.subtitle,
          subtitle_en = excluded.subtitle_en,
          gift_note = excluded.gift_note,
          gift_note_en = excluded.gift_note_en,
          description = excluded.description,
          description_en = excluded.description_en,
          outline = excluded.outline,
          outline_en = excluded.outline_en,
          cover_image = excluded.cover_image,
          detail_images = excluded.detail_images,
          detail = excluded.detail
      `;
    }
    const keepProducts = store.products.map((product) => product.slug);

    const posterRows = store.posters.map((poster) => ({
      id: poster.id,
      title: poster.title,
      title_en: poster.titleEn || null,
      href: poster.href,
      sort: poster.sort,
      placement: poster.placement,
      image: poster.image || null,
      subtitle: poster.subtitle || null,
      subtitle_en: poster.subtitleEn || null,
      kicker: poster.kicker || null,
      kicker_en: poster.kickerEn || null,
      price_label: poster.priceLabel || null,
      price_label_en: poster.priceLabelEn || null,
      theme: poster.theme || null,
    }));
    await sql`delete from posters`;
    if (posterRows.length) await sql`insert into posters ${sql(posterRows)}`;

    const videoRows = store.videos.map((video) => ({
      id: video.id,
      title: video.title,
      title_en: video.titleEn || null,
      poster: video.poster || null,
      video_url: video.videoUrl || null,
      duration: video.duration || null,
      product_slug: video.productSlug || null,
      overlay: video.overlay || null,
      overlay_en: video.overlayEn || null,
      placement: video.placement,
    }));
    await sql`delete from videos`;
    if (videoRows.length) await sql`insert into videos ${sql(videoRows)}`;

    await sql`
      insert into settings ${sql({
        id: 1,
        default_currency: store.settings.defaultCurrency,
        fx: sql.json(store.settings.fx),
      })}
      on conflict (id) do update set default_currency = excluded.default_currency, fx = excluded.fx
    `;
    await sql`
      insert into referral_plan ${sql({
        id: 1,
        compression: store.referralPlan.compression,
        max_payout_sen: store.referralPlan.maxPayoutSen,
        tiers: sql.json(store.referralPlan.tiers),
      })}
      on conflict (id) do update set
        compression = excluded.compression,
        max_payout_sen = excluded.max_payout_sen,
        tiers = excluded.tiers
    `;

    const paymentRows = (store.payments || []).map((payment) => ({
      id: payment.id,
      user_id: payment.userId,
      kind: payment.kind,
      provider: payment.provider,
      status: payment.status,
      amount_sen: payment.amountSen,
      checkout_id: payment.checkoutId || null,
      created_at: payment.createdAt,
      paid_at: payment.paidAt || null,
      cancelled_at: payment.cancelledAt || null,
      note: payment.note || null,
      expected_amount_sen: payment.expectedAmountSen ?? null,
      received_amount_sen: payment.receivedAmountSen ?? null,
      mismatch_billplz_bill_id: payment.mismatchBillplzBillId || null,
      callback_received_at: payment.callbackReceivedAt || null,
    }));
    if (paymentRows.length) {
      await sql`
        insert into payments ${sql(paymentRows)}
        on conflict (id) do update set
          user_id = excluded.user_id,
          kind = excluded.kind,
          provider = excluded.provider,
          status = excluded.status,
          amount_sen = excluded.amount_sen,
          checkout_id = excluded.checkout_id,
          created_at = excluded.created_at,
          paid_at = excluded.paid_at,
          cancelled_at = excluded.cancelled_at,
          note = excluded.note,
          expected_amount_sen = excluded.expected_amount_sen,
          received_amount_sen = excluded.received_amount_sen,
          mismatch_billplz_bill_id = excluded.mismatch_billplz_bill_id,
          callback_received_at = excluded.callback_received_at
      `;
    }
    const keepPayments = ids(store.payments || []);

    const billRows = (store.billplzBills || []).map((bill) => ({
      id: bill.id,
      payment_id: bill.paymentId,
      url: bill.url || null,
      collection_id: bill.collectionId || null,
      amount_sen: bill.amountSen,
      status: bill.status,
      paid_at: bill.paidAt || null,
      last_callback_at: bill.lastCallbackAt || null,
      created_at: bill.createdAt,
    }));
    await sql`delete from billplz_bills`;
    if (billRows.length) await sql`insert into billplz_bills ${sql(billRows)}`;

    const orderRows = store.orders.map((order) => ({
      id: order.id,
      order_no: order.orderNo!,
      user_id: order.userId,
      payment_id: order.paymentId!,
      checkout_id: order.checkoutId!,
      product_slug: order.productSlug,
      product_title: order.productTitle,
      price: order.price,
      price_cny: order.priceCny ?? order.price,
      currency: order.currency || "CNY",
      qty: order.qty,
      created_at: order.createdAt,
      verify_code: order.verifyCode || null,
      status: order.status === "pending" ? "pending" : "paid",
      paid_at: order.paidAt || null,
      pay_method: order.payMethod || null,
      amount_myr: order.amountMyr ?? null,
      amount_sen: order.amountSen || 0,
      referral_settled: order.referralSettled ? sql.json(order.referralSettled) : null,
      referral_skip: order.referralSkip ? sql.json(order.referralSkip) : null,
    }));
    if (orderRows.length) {
      await sql`
        insert into orders ${sql(orderRows)}
        on conflict (id) do update set
          user_id = excluded.user_id,
          payment_id = excluded.payment_id,
          checkout_id = excluded.checkout_id,
          product_slug = excluded.product_slug,
          product_title = excluded.product_title,
          price = excluded.price,
          price_cny = excluded.price_cny,
          currency = excluded.currency,
          qty = excluded.qty,
          created_at = excluded.created_at,
          verify_code = excluded.verify_code,
          status = excluded.status,
          paid_at = excluded.paid_at,
          pay_method = excluded.pay_method,
          amount_myr = excluded.amount_myr,
          amount_sen = excluded.amount_sen,
          referral_settled = excluded.referral_settled,
          referral_skip = excluded.referral_skip
      `;
    }
    const keepOrders = ids(store.orders);
    if (keepOrders.length) await sql`delete from orders where id <> all(${keepOrders})`;
    else await sql`delete from orders`;

    const ledgerRows = store.commissionLedger.map((row) => ({
      id: row.id,
      kind: row.kind,
      user_id: row.userId || null,
      order_id: row.orderId || null,
      buyer_id: row.buyerId || null,
      buyer_name: row.buyerName || null,
      tier: row.tier ?? null,
      rate_percent: row.ratePercent ?? null,
      payout_type: row.payoutType || null,
      fixed_sen: row.fixedSen ?? null,
      base_sen: row.baseSen ?? null,
      amount_sen: row.amountSen,
      paid: row.paid,
      reason: row.reason || null,
      created_at: row.createdAt,
      note: row.note || null,
      relationship_snapshot: row.relationshipSnapshot ? sql.json(row.relationshipSnapshot) : null,
    }));
    await sql`delete from commission_ledger`;
    if (ledgerRows.length) await sql`insert into commission_ledger ${sql(ledgerRows)}`;

    const wtxRows = store.walletTransactions.map((row) => ({
      id: row.id,
      user_id: row.userId,
      amount_sen: row.amountSen,
      bucket: row.bucket,
      kind: row.kind,
      source_type: row.sourceType,
      source_id: row.sourceId,
      note: row.note || null,
      created_at: row.createdAt,
      balance_after_sen: row.balanceAfterSen,
    }));
    await sql`delete from wallet_transactions`;
    if (wtxRows.length) await sql`insert into wallet_transactions ${sql(wtxRows)}`;

    const wdRows = store.withdrawals.map((row) => ({
      id: row.id,
      user_id: row.userId,
      amount_sen: row.amountSen,
      status: normalizeWithdrawalStatus(row.status),
      created_at: row.createdAt,
      approved_at: row.approvedAt || null,
      paid_at: row.paidAt || null,
      rejected_at: row.rejectedAt || null,
      settled_at: row.settledAt || null,
      note: row.note || null,
      payout_bank: row.payout?.bank || null,
      payout_holder: row.payout?.holder || null,
      payout_account: row.payout?.account || null,
    }));
    await sql`delete from withdrawals`;
    if (wdRows.length) await sql`insert into withdrawals ${sql(wdRows)}`;

    const topRows = store.topUps.map((row) => ({
      id: row.id,
      user_id: row.userId,
      payment_id: row.paymentId!,
      amount_sen: row.amountSen,
      status: row.status,
      created_at: row.createdAt,
      credited_at: row.creditedAt || null,
      note: row.note || null,
    }));
    await sql`delete from top_ups`;
    if (topRows.length) await sql`insert into top_ups ${sql(topRows)}`;

    if (keepOrders.length) await sql`delete from orders where id <> all(${keepOrders})`;
    else await sql`delete from orders`;
    if (keepPayments.length) await sql`delete from payments where id <> all(${keepPayments})`;
    else await sql`delete from payments`;
    if (keepProducts.length) await sql`delete from products where slug <> all(${keepProducts})`;
    else await sql`delete from products`;
    const keepUsers = ids(store.users);
    if (keepUsers.length) await sql`delete from users where id <> all(${keepUsers})`;
    else await sql`delete from users`;
  });
}
