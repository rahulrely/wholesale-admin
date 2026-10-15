"use client";
import { FileText } from "lucide-react";
export function PrintButton(){return <button onClick={()=>window.print()} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 print:hidden"><FileText className="size-4"/>Print</button>}
