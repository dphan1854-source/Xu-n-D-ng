export const CURATED_PRODUCT_IMAGES = [
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80', // Tai nghe
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80', // Đồng hồ
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80', // Giày thể thao Nike
  'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&auto=format&fit=crop&q=80', // Kính mát
  'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop&q=80', // Máy ảnh
  'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&auto=format&fit=crop&q=80', // Headset gaming
  'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&auto=format&fit=crop&q=80', // Giày Puma
  'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=600&auto=format&fit=crop&q=80', // Giày da
  'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&auto=format&fit=crop&q=80', // Đồng hồ thông minh
  'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=600&auto=format&fit=crop&q=80', // Nước hoa mỹ phẩm
];

export const getReliableProductImage = (productId: string, existingImage?: string): string => {
  // Nếu ảnh hiện tại là url hợp lệ và KHÔNG phải picsum (picsum hay bị chặn/lỗi ở VN)
  if (existingImage && existingImage.startsWith('http') && !existingImage.includes('picsum.photos')) {
    return existingImage;
  }

  // Băm chuỗi mã vạch để luôn ánh xạ 1 mã vạch -> 1 ảnh cố định, đẹp mắt
  let hash = 0;
  const str = String(productId || 'default');
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }

  const index = Math.abs(hash) % CURATED_PRODUCT_IMAGES.length;
  return CURATED_PRODUCT_IMAGES[index];
};
