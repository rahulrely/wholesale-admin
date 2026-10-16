import Link from "next/link";
import { cookies } from "next/headers";
import { ArrowLeft } from "lucide-react";
import { ACCESS_COOKIE, baseUrl } from "@/lib/auth";
import { OrderDecision } from "@/components/shared/order-decision";
import { PrintButton } from "@/components/shared/print-button";
import { InvoiceAction } from "@/components/shared/invoice-action";
import { ProductActions } from "@/components/shared/product-actions";
import { DeliveryStatusActions } from "@/components/shared/delivery-status-actions";

const endpoints: Record<string, (id: string) => string> = { customers: id => `customers/${id}`, products: id => `products/${id}`, orders: id => `orders/${id}`, invoices: id => `invoices/${id}`, payments: id => `payments/${id}`, deliveries: id => `deliveries/${id}`, notifications: () => `notifications` };
type JsonRecord = Record<string, unknown>;
function isRecord(value: unknown): value is JsonRecord { return typeof value === "object" && value !== null && !Array.isArray(value); }
function valueText(value: unknown): string { return value === null || value === undefined || value === "" ? "—" : typeof value === "boolean" ? (value ? "Yes" : "No") : String(value); }
function money(value: unknown): string { const amount = Number(value); return Number.isFinite(amount) ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 }).format(amount) : "—"; }
function address(value: unknown): string { if (typeof value === "string") return value.trim() || "—"; if (isRecord(value)) return Object.values(value).filter(v => typeof v === "string" && v.trim()).join(", ") || "—"; return "—"; }
function Field({ label, value }: { label: string; value: unknown }) { return <div className="rounded-xl border border-slate-200/80 bg-white px-4 py-3.5"><p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1.5 break-words whitespace-pre-line text-sm font-medium text-slate-800">{valueText(value)}</p></div>; }
async function load(kind: string, id: string): Promise<{data: JsonRecord | null; failed: boolean}> {
  const endpoint = endpoints[kind]; if (!endpoint) return { data: null, failed: false };
  try { const token = (await cookies()).get(ACCESS_COOKIE)?.value; if (!token) return { data: null, failed: true };
    const response = await fetch(`${baseUrl()}/${endpoint(id)}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    if (!response.ok) return { data: null, failed: true };
    const payload: unknown = await response.json();
    if (kind === "notifications" && Array.isArray(payload)) return { data: payload.find(item => isRecord(item) && item.id === id) as JsonRecord ?? null, failed: false };
    if (!isRecord(payload)) return { data: null, failed: false };
    if (kind === "products") {
      const unitsResponse = await fetch(`${baseUrl()}/products/${encodeURIComponent(id)}/units`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
      if (unitsResponse.ok) { const units: unknown = await unitsResponse.json(); if (Array.isArray(units)) payload.units = units.filter(isRecord); }
    }
    if (kind === "customers" && typeof payload.defaultRouteId === "string") {
      const routesResponse = await fetch(`${baseUrl()}/routes`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
      if (routesResponse.ok) { const routes: unknown = await routesResponse.json(); if (Array.isArray(routes)) { const route = routes.find(item => isRecord(item) && item.id === payload.defaultRouteId); if (isRecord(route)) payload.defaultRoute = `${String(route.routeNumber ?? "Route")} · ${String(route.name ?? "")}`; } }
    }
    const relatedOrder = payload.order;
    if (kind === "deliveries" && isRecord(relatedOrder) && typeof relatedOrder.customerId === "string") {
      const customersResponse = await fetch(`${baseUrl()}/customers`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
      if (customersResponse.ok) { const customers: unknown = await customersResponse.json(); if (Array.isArray(customers)) { const customer = customers.find(item => isRecord(item) && item.id === relatedOrder.customerId); if (isRecord(customer)) payload.customerCode = customer.customerCode; } }
    }
    return { data: payload, failed: false };
  } catch { return { data: null, failed: true }; }
}

export async function ResourceDetail({ kind, id }: { kind: string; id: string }) {
  const { data, failed } = await load(kind, id);
  const title = String(data?.outletName ?? data?.name ?? data?.orderCode ?? data?.productCode ?? data?.customerCode ?? data?.invoiceNumber ?? data?.title ?? `${kind.slice(0, -1)} details`);
  const invoice = kind === "invoices";
  const items = Array.isArray(data?.items) ? data.items.filter(isRecord) : [];
  return <main className={`space-y-5 ${invoice ? "invoice-print-root" : ""}`}>
    <div className="print:hidden"><Link href={`/${kind}`} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600"><ArrowLeft className="size-4"/>Back to {kind}</Link></div>
    {failed || !data ? <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center"><p className="font-medium text-slate-800">{failed ? "Could not load this record" : "Record not found"}</p><p className="mt-1 text-sm text-slate-500">{failed ? "The backend request failed. Please return and retry." : "This record may have been removed."}</p></div> : invoice ? <>
      <header className="flex items-start justify-between gap-4"><div><p className="text-xs font-medium uppercase tracking-wider text-indigo-600">Invoice</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{valueText(data.invoiceNumber)}</h1><p className="mt-1 text-sm text-slate-500">Status: {valueText(data.status)}</p></div><div className="print:hidden"><PrintButton/></div></header>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Field label="Order code" value={data.orderCode}/><Field label="Customer code" value={data.customerCode}/><Field label="Customer contact" value={isRecord(data.customer) ? data.customer.phone : null}/>
        <Field label="Billing name" value={data.billingName}/><Field label="Billing address" value={address(data.billingAddress)}/><Field label="Shop name" value={data.shopName}/><Field label="Shop address" value={address(data.shopAddress)}/><Field label="Delivery address" value={address(data.deliveryAddress)}/>
        <Field label="Invoice date" value={data.issuedAt ?? data.createdAt}/><Field label="Due date" value={data.dueDate}/>
      </section>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-semibold text-slate-900">Invoice items</h2>
        {items.length ? <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[820px] text-left text-sm"><thead className="border-b border-slate-200 text-xs text-slate-500"><tr>{["Product", "Product code", "HSN", "Quantity", "Unit", "Unit price", "GST %", "Taxable", "Tax", "Line total"].map(label => <th key={label} className="px-3 py-3">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{items.map((item, index) => <tr key={String(item.id ?? index)}><td className="px-3 py-3 font-medium">{valueText(item.productName)}</td><td className="px-3 py-3">{valueText(item.productCode)}</td><td className="px-3 py-3">{valueText(item.hsnCodeSnapshot)}</td><td className="px-3 py-3">{valueText(item.quantity)}</td><td className="px-3 py-3">{valueText(item.unitNameSnapshot)}</td><td className="px-3 py-3">{money(item.unitPrice)}</td><td className="px-3 py-3">{valueText(item.gstRate)}</td><td className="px-3 py-3">{money(item.taxableAmount)}</td><td className="px-3 py-3">{money(item.taxAmount)}</td><td className="px-3 py-3 font-medium">{money(item.lineTotal)}</td></tr>)}</tbody></table></div> : <p className="mt-4 text-sm text-slate-500">No invoice items were returned.</p>}
        <dl className="ml-auto mt-5 grid max-w-sm grid-cols-2 gap-x-6 gap-y-2 text-sm"><dt>Subtotal</dt><dd className="text-right">{money(data.subtotal)}</dd><dt>Tax</dt><dd className="text-right">{money(data.taxAmount)}</dd><dt>Discount</dt><dd className="text-right">{money(data.discountAmount)}</dd><dt className="border-t border-slate-200 pt-2 font-semibold">Total</dt><dd className="border-t border-slate-200 pt-2 text-right font-semibold">{money(data.totalAmount)}</dd></dl>
      </section>
    </> : <>
      <div className="flex items-start justify-between"><div><p className="text-xs font-medium uppercase tracking-wider text-indigo-600">{kind}</p><h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{title}</h2></div></div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{Object.entries(data).filter(([key, value]) => !/(^id$|Id$|password|token|orderNumber)/i.test(key) && typeof value !== "object").map(([key, value]) => <Field key={key} label={key.replace(/([A-Z])/g, " $1")} value={value}/>)}</div>
      {kind === "deliveries" && isRecord(data.order) && <Field label="Order code" value={data.order.orderCode}/>}
      {kind === "products" && Array.isArray(data.units) && <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5"><h3 className="font-semibold text-slate-900">Product units and retailer availability</h3>{data.units.length ? <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[600px] text-left text-sm"><thead className="border-b border-slate-200 text-xs text-slate-500"><tr>{["Unit", "Conversion", "Price (₹)", "Orderable", "Active"].map(label => <th key={label} className="px-3 py-3">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{data.units.filter(isRecord).map((unit, index) => <tr key={String(unit.id ?? index)}><td className="px-3 py-3 font-medium">{valueText(unit.unitName)}</td><td className="px-3 py-3">{valueText(unit.conversionFactor)}</td><td className="px-3 py-3">{money(unit.sellingPrice)}</td><td className="px-3 py-3">{valueText(unit.isOrderable)}</td><td className="px-3 py-3">{valueText(unit.isActive)}</td></tr>)}</tbody></table></div> : <p className="mt-4 text-sm text-slate-500">No product units are configured.</p>}</section>}
      {items.length > 0 && <div className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="font-semibold text-slate-900">Order items</h3><div className="mt-4 space-y-3">{items.map((item, index) => <div key={String(item.id ?? index)} className="flex flex-wrap justify-between gap-2 border-b border-slate-100 pb-3 last:border-0"><span className="text-sm font-medium">{valueText(item.productName)}{item.productCode ? ` · Product code ${String(item.productCode)}` : ""}</span><span className="text-sm text-slate-500">Qty {valueText(item.quantity)} · {valueText(item.unitNameSnapshot)}</span><span className="text-sm font-medium">{money(item.confirmedLineTotal ?? item.estimatedLineTotal)}</span></div>)}</div></div>}
      {kind === "orders" && data.status === "PLACED" && <OrderDecision id={id}/ >}{kind === "orders" && data.status === "CONFIRMED" && <InvoiceAction orderId={id}/ >}{kind === "products" && <ProductActions id={id} active={data.isActive === true}/ >}{kind === "deliveries" && <DeliveryStatusActions id={id}/ >}
    </>}
  </main>;
}
