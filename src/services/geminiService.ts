import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY } from '@constants/geminiConfig';
import {
    GEMINI_GENERATION_CONFIG,
    GEMINI_MODEL_NAME,
    MAX_HISTORY_TURNS,
    SHOPAI_SYSTEM_PROMPT,
} from '@constants/aiPrompt';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Danh sách các model theo thứ tự ưu tiên (nếu model đầu bị 503 quá tải thì tự động sang model tiếp theo)
const CANDIDATE_MODELS = [GEMINI_MODEL_NAME, 'gemini-3.1-flash-lite', 'gemini-3.8-flash'];

/** Một lượt hội thoại theo đúng định dạng Gemini yêu cầu. */
export type ChatTurn = {
    role: 'user' | 'model';
    parts: { text: string }[];
};

/**
 * Gửi câu hỏi kèm lịch sử hội thoại lên Gemini.
 * Tự động chuyển model dự phòng nếu Google trả về 503 (quá tải tạm thời).
 *
 * @param question Câu hỏi mới của user
 * @param history  Các lượt trước đó (đã theo định dạng Gemini). Nhờ có nó, AI mới
 *                 hiểu được câu "cái đó giá bao nhiêu?" đang nói về sản phẩm nào.
 */
export const askShopAI = async (question: string, history: ChatTurn[] = []): Promise<string> => {
    // Cắt bớt lịch sử: chỉ giữ N lượt gần nhất để không phình chi phí (Phần 8.11)
    const trimmed = history.slice(-MAX_HISTORY_TURNS * 2);

    let lastError: unknown;
    for (const modelName of CANDIDATE_MODELS) {
        try {
            const model = genAI.getGenerativeModel({
                model: modelName,
                systemInstruction: SHOPAI_SYSTEM_PROMPT,
                generationConfig: GEMINI_GENERATION_CONFIG,
            });

            const chat = model.startChat({ history: trimmed });
            const result = await chat.sendMessage(question);
            const text = result.response.text();

            if (!text || !text.trim()) {
                throw new Error('AI không trả lời được câu này (có thể đã bị bộ lọc an toàn chặn).');
            }

            return text.trim();
        } catch (err) {
            console.warn(`[ShopAI] Model ${modelName} gặp lỗi/quá tải, đang chuyển model khác...`, err);
            lastError = err;
        }
    }

    throw lastError;
};

/** Chuyển thông báo lỗi kỹ thuật thành câu chữ mà người dùng đọc hiểu được. */
export const toFriendlyError = (error: unknown): string => {
    console.error('❌ [ShopAI Gemini Error]:', error);
    const msg = error instanceof Error ? error.message : String(error);

    if (msg.includes('503') || msg.includes('high demand') || msg.includes('overloaded'))
        return 'Hệ thống AI đang quá tải tạm thời. Bạn bấm nút "🔄 Thử lại" nhé.';
    if (msg.includes('429'))
        return 'Trợ lý đang bận (quá nhiều yêu cầu). Bạn đợi vài giây rồi thử lại nhé.';
    if (msg.includes('API key') || msg.includes('401') || msg.includes('403'))
        return 'API Key chưa đúng. Hãy kiểm tra lại file geminiConfig.ts.';
    if (msg.includes('404'))
        return 'Model AI không khả dụng hoặc đã đổi phiên bản. Hãy kiểm tra lại cấu hình model.';
    if (msg.includes('Network request failed') || msg.includes('Failed to fetch') || msg.includes('ENOTFOUND'))
        return 'Mất kết nối mạng. Bạn kiểm tra Wi-Fi/4G giúp mình nhé.';
    if (msg.includes('bộ lọc an toàn'))
        return msg;

    return 'Trợ lý gặp sự cố tạm thời. Bạn thử lại giúp mình nhé.';
};