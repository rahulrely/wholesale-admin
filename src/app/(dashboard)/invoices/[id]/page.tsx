import { ResourceDetail } from "@/components/shared/resource-detail";
export const instant = false;
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <ResourceDetail kind="invoices" id={id}/>;}
