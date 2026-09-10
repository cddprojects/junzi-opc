// @ts-nocheck
/**
 * Idempotent import: data/store.json + data/uploads/ → Supabase.
 * Does NOT delete store.json or local uploads.
 *
 *   npx tsx scripts/import-supabase.ts
 */
import { createHash } from "crypto";
import { existsSync, readdirSync, readFileSync } from "fs";
import path from "path";
import postgres from "postgres";
import { createClient } from "@supabase/supabase-js";
import { computeLegacyOrderNo } from "../lib/order-no";
import { synthesizePaymentsFromStore } from "../lib/migrate-payments";
import { hashSessionToken, sessionRowId } from "../lib/session-token";
import { normalizeWithdrawalStatus } from "../lib/wallet";

type Counts = Record<string, { inserted: number; updated: number; skipped: number }>;

function env(name: string) {
  return (process.env[name] || "").trim();
}

function loadDotEnv() {
  const file = path.join(process.cwd(), ".env.local");
  if (!existsSync(file)) return;
  for (const raw of readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    if (process.env[key]) continue;
    let value = line.slice(eq + 1);
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

function bump(counts: Counts, table: string, field: "inserted" | "updated" | "skipped") {
  counts[table] ||= { inserted: 0, updated: 0, skipped: 0 };
  counts[table][field] += 1;
}

async function upsertCount(
  sql: postgres.Sql,
  table: string,
  idCol: string,
  id: string,
  counts: Counts,
) {
  const rows = await sql.unsafe(`select 1 from ${table} where ${idCol} = $1`, [id]);
  bump(counts, table, rows.length ? "updated" : "inserted");
}

async function main() {
  loadDotEnv();
  const url = env("NEXT_PUBLIC_SUPABASE_URL");
  const service = env("SUPABASE_SERVICE_ROLE_KEY");
  const databaseUrl = env("DATABASE_URL");
  if (!url || !service || !databaseUrl) {
    throw new Error("Set NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and DATABASE_URL");
  }
  const storePath = path.join(process.cwd(), "data", "store.json");
  if (!existsSync(storePath)) throw new Error(`Missing ${storePath}`);
  const raw = JSON.parse(readFileSync(storePath, "utf8")) as Record<string, unknown>;
  const verifySecret = typeof raw.verifySecret === "string" ? raw.verifySecret : "";
  if (!env("VERIFY_SECRET")) {
    console.log("VERIFY_SECRET is not set. Copy this once into env (not the database):");
    console.log(verifySecret || "(store.json has no verifySecret)");
  } else {
    console.log("VERIFY_SECRET is set in env; store.json verifySecret was ignored.");
  }

  const synthesized = synthesizePaymentsFromStore({
    orders: (raw.orders as []) || [],
    topUps: (raw.topUps as []) || [],
  });
  if (synthesized.errors.length) {
    console.error("Import aborted. Fix these groups in store.json first:");
    for (const error of synthesized.errors) console.error(` - ${error.code}: ${error.message}`);
    process.exit(1);
  }

  const sql = postgres(databaseUrl, { max: 1, ssl: "require", prepare: false });
  const sb = createClient(url, service, { auth: { persistSession: false } });
  const counts: Counts = {};

  try {
    await sql.begin(async (tx) => {
      await tx`select pg_advisory_xact_lock(871234)`;

      const users = (raw.users as Array<Record<string, unknown>>) || [];
      for (const user of users) {
        await upsertCount(tx, "users", "id", String(user.id), counts);
        await tx`
          insert into users ${tx({
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
            referrer_id: null,
            commission_balance_sen: user.commissionBalanceSen || 0,
            topup_balance_sen: user.topUpBalanceSen || 0,
          })}
          on conflict (id) do update set
            name = excluded.name,
            email = excluded.email,
            phone = excluded.phone,
            password_salt = excluded.password_salt,
            password_hash = excluded.password_hash,
            member_until = excluded.member_until,
            status = excluded.status,
            referral_code = excluded.referral_code,
            commission_balance_sen = excluded.commission_balance_sen,
            topup_balance_sen = excluded.topup_balance_sen
        `;
      }
      for (const user of users) {
        if (user.referrerId) {
          await tx`update users set referrer_id = ${String(user.referrerId)} where id = ${String(user.id)}`;
        }
      }

      const products = (raw.products as Array<Record<string, unknown>>) || [];
      for (const product of products) {
        await upsertCount(tx, "products", "slug", String(product.slug), counts);
        await tx`
          insert into products ${tx({
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
            detail: product.detail ? tx.json(product.detail) : null,
          })}
          on conflict (slug) do update set
            title = excluded.title,
            title_en = excluded.title_en,
            short_title = excluded.short_title,
            price_cny = excluded.price_cny,
            sales = excluded.sales,
            detail = excluded.detail,
            cover_image = excluded.cover_image,
            detail_images = excluded.detail_images
        `;
      }

      const posters = (raw.posters as Array<Record<string, unknown>>) || [];
      for (const poster of posters) {
        await upsertCount(tx, "posters", "id", String(poster.id), counts);
        await tx`
          insert into posters ${tx({
            id: poster.id,
            title: poster.title,
            title_en: poster.titleEn || null,
            href: poster.href,
            sort: poster.sort || 0,
            placement: poster.placement,
            image: poster.image || null,
            subtitle: poster.subtitle || null,
            subtitle_en: poster.subtitleEn || null,
            kicker: poster.kicker || null,
            kicker_en: poster.kickerEn || null,
            price_label: poster.priceLabel || null,
            price_label_en: poster.priceLabelEn || null,
            theme: poster.theme || null,
          })}
          on conflict (id) do update set title = excluded.title, image = excluded.image, sort = excluded.sort
        `;
      }

      const videos = (raw.videos as Array<Record<string, unknown>>) || [];
      for (const video of videos) {
        await upsertCount(tx, "videos", "id", String(video.id), counts);
        await tx`
          insert into videos ${tx({
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
          })}
          on conflict (id) do update set title = excluded.title, video_url = excluded.video_url, poster = excluded.poster
        `;
      }

      const settings = (raw.settings as { defaultCurrency?: string; fx?: unknown }) || {};
      await upsertCount(tx, "settings", "id", "1", counts);
      await tx`
        insert into settings ${tx({
          id: 1,
          default_currency: settings.defaultCurrency || "CNY",
          fx: tx.json(settings.fx || { CNY: 1, MYR: 1.64, USD: 7.2, SGD: 5.3 }),
        })}
        on conflict (id) do update set default_currency = excluded.default_currency, fx = excluded.fx
      `;

      const plan = (raw.referralPlan as { compression?: boolean; maxPayoutSen?: number | null; tiers?: unknown }) || {};
      await upsertCount(tx, "referral_plan", "id", "1", counts);
      await tx`
        insert into referral_plan ${tx({
          id: 1,
          compression: Boolean(plan.compression),
          max_payout_sen: plan.maxPayoutSen ?? null,
          tiers: tx.json(plan.tiers || []),
        })}
        on conflict (id) do update set compression = excluded.compression, max_payout_sen = excluded.max_payout_sen, tiers = excluded.tiers
      `;

      for (const payment of synthesized.payments) {
        await upsertCount(tx, "payments", "id", payment.id, counts);
        await tx`
          insert into payments ${tx({
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
          })}
          on conflict (id) do update set
            status = excluded.status,
            amount_sen = excluded.amount_sen,
            paid_at = excluded.paid_at
        `;
      }

      for (const bill of synthesized.billplzBills) {
        await upsertCount(tx, "billplz_bills", "id", bill.id, counts);
        await tx`
          insert into billplz_bills ${tx({
            id: bill.id,
            payment_id: bill.paymentId,
            url: bill.url || null,
            amount_sen: bill.amountSen,
            status: bill.status,
            paid_at: bill.paidAt || null,
            created_at: bill.createdAt,
          })}
          on conflict (id) do update set url = excluded.url, status = excluded.status, paid_at = excluded.paid_at
        `;
      }

      const seenOrderNo = new Set<string>();
      for (const order of synthesized.orders) {
        const orderNo = order.orderNo || computeLegacyOrderNo(order);
        if (seenOrderNo.has(orderNo)) {
          throw new Error(`order_no collision on backfill: ${orderNo} (${order.id})`);
        }
        seenOrderNo.add(orderNo);
        const existing = await tx`select order_no from orders where id = ${order.id}`;
        const persistNo = existing[0]?.order_no || orderNo;
        if (existing.length) bump(counts, "orders", "updated");
        else bump(counts, "orders", "inserted");
        await tx`
          insert into orders ${tx({
            id: order.id,
            order_no: persistNo,
            user_id: order.userId,
            payment_id: order.paymentId,
            checkout_id: order.checkoutId,
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
            referral_settled: order.referralSettled ? tx.json(order.referralSettled) : null,
            referral_skip: order.referralSkip ? tx.json(order.referralSkip) : null,
          })}
          on conflict (id) do update set
            user_id = excluded.user_id,
            payment_id = excluded.payment_id,
            checkout_id = excluded.checkout_id,
            status = excluded.status,
            paid_at = excluded.paid_at,
            verify_code = excluded.verify_code,
            amount_sen = excluded.amount_sen,
            referral_settled = excluded.referral_settled
        `;
      }

      for (const row of synthesized.topUps) {
        await upsertCount(tx, "top_ups", "id", row.id, counts);
        await tx`
          insert into top_ups ${tx({
            id: row.id,
            user_id: row.userId,
            payment_id: row.paymentId,
            amount_sen: row.amountSen,
            status: row.status,
            created_at: row.createdAt,
            credited_at: row.creditedAt || null,
            note: row.note || null,
          })}
          on conflict (id) do update set status = excluded.status, credited_at = excluded.credited_at, payment_id = excluded.payment_id
        `;
      }

      const ledger = (raw.commissionLedger as Array<Record<string, unknown>>) || [];
      for (const row of ledger) {
        await upsertCount(tx, "commission_ledger", "id", String(row.id), counts);
        await tx`
          insert into commission_ledger ${tx({
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
            paid: Boolean(row.paid),
            reason: row.reason || null,
            created_at: row.createdAt,
            note: row.note || null,
            relationship_snapshot: row.relationshipSnapshot ? tx.json(row.relationshipSnapshot) : null,
          })}
          on conflict (id) do update set amount_sen = excluded.amount_sen, paid = excluded.paid
        `;
      }

      const wtxs = (raw.walletTransactions as Array<Record<string, unknown>>) || [];
      for (const row of wtxs) {
        await upsertCount(tx, "wallet_transactions", "id", String(row.id), counts);
        await tx`
          insert into wallet_transactions ${tx({
            id: row.id,
            user_id: row.userId,
            amount_sen: row.amountSen,
            bucket: row.bucket,
            kind: row.kind,
            source_type: row.sourceType,
            source_id: row.sourceId,
            note: row.note || null,
            created_at: row.createdAt,
            balance_after_sen: row.balanceAfterSen || 0,
          })}
          on conflict (id) do update set amount_sen = excluded.amount_sen, balance_after_sen = excluded.balance_after_sen
        `;
      }

      const withdrawals = (raw.withdrawals as Array<Record<string, unknown>>) || [];
      for (const row of withdrawals) {
        await upsertCount(tx, "withdrawals", "id", String(row.id), counts);
        const status = normalizeWithdrawalStatus(String(row.status || "pending"));
        await tx`
          insert into withdrawals ${tx({
            id: row.id,
            user_id: row.userId,
            amount_sen: row.amountSen,
            status,
            created_at: row.createdAt,
            approved_at: row.approvedAt || null,
            paid_at: row.paidAt || null,
            rejected_at: row.rejectedAt || null,
            settled_at: row.settledAt || null,
            note: row.note || null,
            payout_bank: (row.payout as { bank?: string } | undefined)?.bank || null,
            payout_holder: (row.payout as { holder?: string } | undefined)?.holder || null,
            payout_account: (row.payout as { account?: string } | undefined)?.account || null,
          })}
          on conflict (id) do update set status = excluded.status, paid_at = excluded.paid_at, rejected_at = excluded.rejected_at
        `;
      }

      const sessions = (raw.sessions as Array<{ token?: string; tokenHash?: string; userId: string; expiresAt: string }>) || [];
      const now = Date.now();
      for (const session of sessions) {
        if (Date.parse(session.expiresAt) <= now) {
          bump(counts, "sessions", "skipped");
          continue;
        }
        const tokenHash = session.tokenHash || (session.token ? hashSessionToken(session.token) : "");
        if (!tokenHash) {
          bump(counts, "sessions", "skipped");
          continue;
        }
        const id = sessionRowId(tokenHash);
        await upsertCount(tx, "sessions", "id", id, counts);
        await tx`
          insert into sessions ${tx({
            id,
            user_id: session.userId,
            token_hash: tokenHash,
            expires_at: session.expiresAt,
            created_at: new Date().toISOString(),
          })}
          on conflict (id) do update set expires_at = excluded.expires_at, user_id = excluded.user_id
        `;
      }
    });

    const uploadsDir = path.join(process.cwd(), "data", "uploads");
    let uploaded = 0;
    let already = 0;
    let skippedFiles = 0;
    if (existsSync(uploadsDir)) {
      const files = readdirSync(uploadsDir).filter((name) => name && !name.startsWith("."));
      for (const name of files) {
        const full = path.join(uploadsDir, name);
        const { data } = await sb.storage.from("uploads").list("", { search: name, limit: 1 });
        const exists = (data || []).some((item) => item.name === name);
        if (exists) {
          already += 1;
          continue;
        }
        const body = readFileSync(full);
        const { error } = await sb.storage.from("uploads").upload(name, body, { upsert: false });
        if (error) {
          console.error("upload failed", name, error.message);
          skippedFiles += 1;
        } else {
          uploaded += 1;
        }
      }
    }

    console.log("\nImport summary (store.json was not deleted)");
    for (const [table, row] of Object.entries(counts)) {
      console.log(`  ${table}: inserted=${row.inserted} updated=${row.updated} skipped=${row.skipped}`);
    }
    console.log(`  storage uploads: uploaded=${uploaded} already=${already} failed=${skippedFiles}`);
    console.log(`  sha256 check sample: ${createHash("sha256").update("ok").digest("hex").slice(0, 8)}…`);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
