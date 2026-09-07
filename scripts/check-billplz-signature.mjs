import { createHmac, timingSafeEqual } from "crypto";

function source(params) {
  return Object.entries(params)
    .filter(([key]) => key.toLowerCase() !== "x_signature")
    .map(([key, value]) => `${key}${value ?? ""}`)
    .sort((left, right) => left.localeCompare(right, "en", { sensitivity: "base" }))
    .join("|");
}

function sign(params, key) {
  return createHmac("sha256", key).update(source(params)).digest("hex");
}

function assert(name, actual, expected) {
  const left = Buffer.from(actual);
  const right = Buffer.from(expected);
  const ok = left.length === right.length && timingSafeEqual(left, right);
  if (!ok) {
    console.error(name, "\n actual  ", actual, "\n expected", expected);
    process.exitCode = 1;
    return;
  }
  console.log("ok", name);
}

const redirect = {
  billplzid: "zq0tm2wc",
  billplzpaid: "true",
  billplzpaid_at: "2018-09-27 15:15:09 +0800",
};
assert(
  "redirect",
  sign(redirect, "S-s7b4yWpp9h7rrkNM1i3Z_g"),
  "4aab095fe5a39b1d534500988f9a0cb085cd1b6d5bbb55dd4e02ea6fa102b47b",
);
