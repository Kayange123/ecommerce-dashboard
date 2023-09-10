import {ColumnDef} from "@tanstack/react-table";


export type OrderColumn = {
    id: string;
    phone: string;
    isPaid: boolean;
    address: string;
    totalPrice: string | number;
    products: string;
    createdAt: string;
}

export const Columns: ColumnDef<OrderColumn>[] = [
    {
        accessorKey: "products",
        header: "Products",
    },
    {
        accessorKey: "phone",
        header: "Phone",
    },
    {
        accessorKey: "address",
        header: "Address",
    },
    {
        accessorKey: "totalPrice",
        header: "Total Price",
    },
    {
        accessorKey: "isPaid",
        header: "Paid",
    }
    
] 
