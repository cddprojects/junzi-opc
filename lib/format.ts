export function formatPrice(value: number) {
  return value.toFixed(2);
}

export function formatYen(value: number) {
  return `¥ ${formatPrice(value)}`;
}

export function formatSales(count: number) {
  return `销量: ${count}`;
}

export function formatLearners(count: number) {
  return `${count}人学习`;
}
