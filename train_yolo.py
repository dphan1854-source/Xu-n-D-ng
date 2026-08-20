# Script train YOLO11 cho ShopAI
import os
from ultralytics import YOLO

def main():
    # 1. Tải mô hình YOLO11n pre-trained (Bản nano nhẹ & nhanh nhất)
    # Dùng file .pt để transfer learning thay vì train từ đầu với file .yaml
    print("⏳ Đang tải mô hình YOLO11n pre-trained...")
    model = YOLO("yolo11n.pt")

    # 2. Kiểm tra xem file dataset.yaml có tồn tại không
    dataset_path = "dataset.yaml"
    if not os.path.exists(dataset_path):
        print(f"❌ Không tìm thấy file '{dataset_path}'! Hãy tạo file {dataset_path} trước khi train.")
        return

    # 3. Tiến hành Huấn luyện (Train)
    print("🚀 Bắt đầu quá trình huấn luyện (Training)...")
    results = model.train(
        data=dataset_path, # Đường dẫn file cấu hình dataset
        epochs=100,        # Số lượt train
        imgsz=640,         # Kích thước ảnh resize 640x640
        batch=16,          # Batch size (Giảm xuống 8 nếu bị hết VRAM/RAM)
        optimizer="Adam",  # Thuật toán tối ưu
        device=0           # Điền 0 nếu có GPU NVIDIA, điền "cpu" nếu dùng CPU
    )

    print("✅ Train hoàn tất!")
    print("📁 Mô hình tốt nhất (weights) đã được lưu tại: runs/detect/train/weights/best.pt")

if __name__ == "__main__":
    main()
