/**
 * Tính toán số từ gõ trên phút (WPM - Words Per Minute)
 * Dựa trên tiêu chuẩn quốc tế: 1 từ = 5 ký tự gõ đúng (bao gồm khoảng trắng)
 * @param correctChars Tổng số ký tự gõ chính xác
 * @param timeInSeconds Thời gian đã sử dụng tính bằng giây
 * @returns WPM (làm tròn lên)
 */
export function calculateWPM(correctChars: number, timeInSeconds: number): number {
    if (timeInSeconds === 0) return 0;

    const minutes = timeInSeconds / 60;
    // 5 ký tự = 1 từ
    const words = correctChars / 5;
    const wpm = words / minutes;

    return Math.round(wpm);
}

/**
 * Tính toán độ chính xác (Accuracy)
 * @param correctChars Số ký tự đúng
 * @param totalTypedChars Tổng số ký tự đã gõ (bao gồm sai)
 * @returns Tỉ lệ phần trăm (làm tròn số nguyên)
 */
export function calculateAccuracy(correctChars: number, totalTypedChars: number): number {
    if (totalTypedChars === 0) return 100; // Mặc định 100% khi chưa khởi động

    const accuracy = (correctChars / totalTypedChars) * 100;
    return Math.round(accuracy);
}
