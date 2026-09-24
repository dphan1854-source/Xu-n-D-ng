// src/services/barcodeService.ts
import { Product } from '../types/product.schema';
import { getReliableProductImage } from '@utils/productImages';
import { SHOP_PRODUCTS } from '../data/mockProducts';

/**
 * Tự động lọc sạch mã quét: loại bỏ HTTP, HTTPS, domain URL từ các trang tạo mã QR
 * để lấy đúng mã sản phẩm nguyên bản của ShopAI (ví dụ: 123330, 123331, 123332,...)
 */
export const extractCleanCode = (input: string): string => {
  if (!input) return '';
  let str = String(input).trim();

  // 1. Tìm trực tiếp xem trong chuỗi có chứa mã sản phẩm ShopAI không (12333X hoặc prod_X)
  const directMatch = str.match(/(12333\d+)/) || str.match(/(prod_\d+)/i);
  if (directMatch && directMatch[1]) {
    return directMatch[1];
  }

  // 2. Nếu là đường dẫn URL
  if (/^https?:\/\//i.test(str)) {
    try {
      // Ưu tiên: Bóc tách tham số truy vấn: ?id=..., ?productId=..., ?code=..., ?item=...
      const queryMatch = str.match(/[?&](?:id|productId|code|item|product)=([^&]+)/i);
      if (queryMatch && queryMatch[1]) {
        return decodeURIComponent(queryMatch[1]).trim();
      }

      // Lấy phần tử cuối cùng trong đường dẫn (ví dụ: https://shop.vn/product/123332 -> 123332)
      const urlWithoutQuery = str.split('?')[0].split('#')[0];
      const segments = urlWithoutQuery.split('/').filter(Boolean);
      if (segments.length > 0) {
        const lastSegment = decodeURIComponent(segments[segments.length - 1]).trim();
        const cleanedLast = lastSegment.replace(/\.(html|php|json)$/i, '');
        if (cleanedLast && !/^https?:?$/i.test(cleanedLast) && !cleanedLast.includes('.')) {
          return cleanedLast;
        }
      }

      // Loại bỏ sạch http://, https://, www.
      str = str.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '');
    } catch {
      // Bỏ qua lỗi
    }
  }

  // 3. Loại bỏ các tiền tố như "ID:", "Mã:", "Code:"
  str = str.replace(/^(id|mã|code|product):\s*/i, '').trim();

  return str;
};

/**
 * Giải mã thông minh: nếu mã quét là link rút gọn động (dynamic QR) như me-qr.com/tc1lpu47,
 * hàm sẽ thử phân giải nội dung trang để lấy đúng mã sản phẩm thật được giấu bên trong!
 */
export const resolveScannedCode = async (rawCode: string): Promise<string> => {
  if (!rawCode) return '';
  const trimmed = String(rawCode).trim();

  // 1. Nếu trong chuỗi đã chứa mã 12333X hoặc prod_X -> Trả về ngay lập tức
  const directMatch = trimmed.match(/(12333\d+)/) || trimmed.match(/(prod_\d+)/i);
  if (directMatch && directMatch[1]) {
    return directMatch[1];
  }

  // 2. Nếu là URL link rút gọn của các trang tạo QR (như me-qr.com, qrco.de, q-r.to,...)
  if (/^https?:\/\//i.test(trimmed) || /^(me-qr\.com)/i.test(trimmed)) {
    const fullUrl = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const res = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      // A. Kiểm tra URL sau khi redirect
      const finalUrl = res.url || '';
      const redirectMatch = finalUrl.match(/(12333\d+)/) || finalUrl.match(/(prod_\d+)/i);
      if (redirectMatch && redirectMatch[1]) {
        return redirectMatch[1];
      }

      // B. Kiểm tra nội dung trang HTML
      const text = await res.text();
      const bodyMatch = text.match(/(12333\d+)/) || text.match(/(prod_\d+)/i);
      if (bodyMatch && bodyMatch[1]) {
        return bodyMatch[1];
      }
    } catch {
      // Timeout hoặc lỗi kết nối
    }
  }

  return extractCleanCode(trimmed);
};

/**
 * Đồng bộ chính xác thông tin sản phẩm theo mã quét được trong hệ thống ShopAI
 */
export const findShopProduct = (
  scannedCode: string,
  cachedProducts: Product[] = []
): Product => {
  const code = extractCleanCode(scannedCode);

  // 1. Tìm trực tiếp trong danh mục sản phẩm chính thức ShopAI
  const inShop = SHOP_PRODUCTS.find(
    (p) => p.id === code || p.id.toLowerCase() === code.toLowerCase()
  );
  if (inShop) return inShop;

  // 2. Tìm trong cache nếu có
  const inCache = cachedProducts.find(
    (p) => p.id === code || p.id.toLowerCase() === code.toLowerCase()
  );
  if (inCache) return inCache;

  // 3. Khớp mã Cloud 12333X hoặc số thứ tự X (0 - 29) của ShopAI
  const cloudMatch = code.match(/12333(\d+)/) || code.match(/^(\d+)$/);
  if (cloudMatch) {
    const index = parseInt(cloudMatch[1], 10);
    if (index >= 0 && index < SHOP_PRODUCTS.length) {
      return SHOP_PRODUCTS[index];
    }
  }

  // 4. Khớp mã prod_X của ShopAI
  const prodMatch = code.match(/prod_(\d+)/i);
  if (prodMatch) {
    const index = parseInt(prodMatch[1], 10);
    const targetIdx = index % SHOP_PRODUCTS.length;
    return SHOP_PRODUCTS[targetIdx];
  }

  // 5. NẾU KHÔNG TÌM THẤY:
  // TUYỆT ĐỐI KHÔNG GÁN BỪA VÀO SẢN PHẨM KHÁC (như Micro thu âm)!
  // Báo rõ ràng để người dùng biết mã chưa được nhận diện đúng
  return {
    id: code,
    name: `Mã không có trong ShopAI (${code})`,
    price: 0,
    image: getReliableProductImage('fallback_safe'),
  };
};
