import prismadb from "@/lib/prismadb";

interface IGraphData {
  name: string;
  total: number;
}

export const getTotalRevenue = async (storeId: string) => {
  const paidOrders = await prismadb.order.findMany({
    where: {
      storeId,
      isPaid: true,
    },
    include: {
      orderItems: {
        include: {
          product: true,
        },
      },
    },
  });

  const totalRevenue = paidOrders.reduce((total, order) => {
    const orderTotal = order.orderItems.reduce((orderSum, item) => {
      return orderSum + item.product.price;
    }, 0);
    return orderTotal + total;
  }, 0);

  return totalRevenue;
};

export const getTotalSales = async (storeId: string) => {
  return await prismadb.order.count({
    where: {
      storeId,
      isPaid: true,
    },
  });
};
export const getStockSize = async (storeId: string) => {
  return await prismadb.product.count({
    where: {
      storeId,
      isArchived: false,
    },
  });
};
export const getGraphRevenue = async (storeId: string) => {
  const orders = await prismadb.order.findMany({
    where: {
      storeId,
      isPaid: true,
    },
    include: {
      orderItems: {
        include: {
          product: true,
        },
      },
    },
  });

  const monthlyOrder: { [key: number]: number } = {};

  for (const order of orders) {
    const month = order.createdAt.getMonth();
    let revenueForOrder = 0;

    for (const item of order.orderItems) {
      revenueForOrder += item.product.price;
    }
    monthlyOrder[month] = (monthlyOrder[month] || 0) + revenueForOrder;
  }

  const graphData: IGraphData[] = [
    { name: "Jan", total: 0 },
    { name: "Feb", total: 0 },
    { name: "Mar", total: 0 },
    { name: "Apr", total: 0 },
    { name: "May", total: 0 },
    { name: "Jun", total: 0 },
    { name: "Jul", total: 0 },
    { name: "Aug", total: 0 },
    { name: "Sep", total: 0 },
    { name: "Oct", total: 0 },
    { name: "Nov", total: 0 },
    { name: "Dec", total: 0 },
  ];

  for (const month in monthlyOrder) {
    graphData[parseInt(month)].total = monthlyOrder[parseInt(month)];
  }

  return graphData;
};
