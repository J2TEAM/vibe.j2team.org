export interface BlameItem {
  id: number
  target: string // Thằng FE, Backend, Khách hàng, ...
  title: string
  reason: string // Lý do để cãi lại
  color: string // Tailwind color class
}

export const blames: BlameItem[] = [
  {
    id: 1,
    target: 'THẰNG FRONTEND',
    title: 'Giao diện vỡ nát',
    reason: '"Backend trả data cấu trúc lạ quá, em parse không kịp nên nó sập. Đâu phải tại em!"',
    color: 'text-[#61DAFB]',
  },
  {
    id: 2,
    target: 'THẰNG BACKEND',
    title: 'API Timeout 504',
    reason: '"Database query lâu quá chứ API em chạy 1ms. Đứa nào viết câu query JOIN 5 bảng kia?"',
    color: 'text-[#339933]',
  },
  {
    id: 3,
    target: 'DEVOPS / SYSADMIN',
    title: 'Server bốc khói',
    reason:
      '"Do mớ code rác rưởi của mấy người ăn hết RAM. Tôi scale lên 32 node rồi vẫn không gánh nổi!"',
    color: 'text-accent-coral',
  },
  {
    id: 4,
    target: 'MẶC ĐỊNH LÀ LỖI QA',
    title: 'Miss Bug lúc test',
    reason: '"Trên máy test của em nó không bị! Specs cũng không ghi vụ này mà!"',
    color: 'text-accent-amber',
  },
  {
    id: 5,
    target: 'THẰNG ĐÃ NGHỈ VIỆC',
    title: 'Legacy Code giỗ đầu',
    reason:
      '"Code này thằng Nam viết từ 2 năm trước rồi. Giờ nó đi Úc rồi ai mà hiểu được nó viết gì. Đập đi viết lại thôi!"',
    color: 'text-text-dim',
  },
  {
    id: 6,
    target: 'CLIENT / KHÁCH HÀNG',
    title: 'Dùng ngu còn báo lỗi',
    reason:
      '"Không phải Bug, đây là một Tính Năng ẩn! Ai bảo khách hàng tự ý bấm liên tục 10 lần vào cái nút Submit làm gì?"',
    color: 'text-[#DD0031]',
  },
  {
    id: 7,
    target: 'INTERNET CÁP QUANG',
    title: 'Cá mập cắn cáp',
    reason:
      '"Mạng công ty nhà mạng FPT VNPT Viettel đang rớt gói tin. Load file JS thất bại. Tại nhà mạng, không phải tại Dev."',
    color: 'text-accent-sky',
  },
  {
    id: 8,
    target: 'AWS / CLOUD DOWN',
    title: 'us-east-1 Outage',
    reason:
      '"Ông tỷ phú Jeff Bezos rút điện server rồi. Cả thế giới sập chứ riêng gì app mình. Cứ đi uống cafe đi."',
    color: 'text-[#FF9900]',
  },
  {
    id: 9,
    target: 'PROJECT MANAGER',
    title: 'Ép tiến độ',
    reason: '"Bắt làm xong cái tính năng to vãi trong 2 ngày thì chả bug lòi ra. Ép cho cố vào!"',
    color: 'text-[#FF3E00]',
  },
  {
    id: 10,
    target: 'THẰNG TECH LEAD',
    title: 'Duyệt PR mù quáng',
    reason:
      '"Ai là người Approve cái Pull Request chứa rác này? LGTM (Looks Good To Me) à? Mắt ông Lead để đâu?"',
    color: 'text-text-primary',
  },
  {
    id: 11,
    target: 'THẾ LỰC TÂM LINH',
    title: 'Chưa cúng server',
    reason:
      '"Tháng này mùng 1 anh em quên mua nải chuối cúng server rồi phải không? Máy móc nó hờn đấy."',
    color: 'text-accent-amber',
  },
  {
    id: 12,
    target: 'TRÌNH DUYỆT SAFARI',
    title: 'Ông kẹ web dev',
    reason:
      '"Code chạy mượt trên Chrome, Firefox, Edge, nhưng lại gãy trên Safari. Nó là IE thời hiện đại, chịu thôi!"',
    color: 'text-[#00ADD8]',
  },
]
