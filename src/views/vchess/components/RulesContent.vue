<template>
  <ul class="space-y-3 list-none font-body text-xs leading-relaxed text-text-secondary">
    <li>
      <p class="font-display font-semibold text-text-primary">Bàn &amp; tọa độ</p>
      <p class="mt-1">
        Lưới 9×11 ô. Ô gọi bằng <strong class="text-text-primary">chữ + số</strong> (ví dụ
        <code class="text-accent-sky/90">d5</code>): chữ
        <span class="text-text-primary">a→k</span> là hàng (dưới lên), số
        <span class="text-text-primary">1→9</span> là cột (trái sang phải). Góc
        <code class="text-accent-sky/90">a1</code> dưới–trái.
      </p>
    </li>
    <li>
      <p class="font-display font-semibold text-text-primary">Lượt</p>
      <p class="mt-1">
        <strong class="text-accent-coral">Đỏ</strong> đi trước, sau đó hai phe luân phiên một nước.
        Giống cờ vua: không được để vua mình bị chiếu sau nước đi; bị chiếu thì phải thoát chiếu.
      </p>
    </li>
    <li>
      <p class="font-display font-semibold text-text-primary">Quân (ý chính)</p>
      <ul class="mt-1 list-disc space-y-1 pl-4 marker:text-accent-amber/80">
        <li>
          <strong class="text-text-primary">Xe</strong> — thẳng ngang/dọc, không nhảy qua quân.
        </li>
        <li>
          <strong class="text-text-primary">Mã</strong> — chữ L như cờ tướng, bị chặn ở ô cản chân.
        </li>
        <li>
          <strong class="text-text-primary">Tốt</strong> — tối đa 1 ô về phía trước (thẳng hoặc chéo
          trước); không ngang, không lùi, không phong cấp.
        </li>
        <li>
          <strong class="text-text-primary">Xạ thủ</strong> — ba ô đích kiểu “xạ” phía trước; không
          ăn ô sát ngay trước mặt; có thể bị chặn ở ô liền trước mặt.
        </li>
        <li>
          <strong class="text-text-primary">Tượng</strong> — tập hợp nước của tốt + xạ thủ phía
          trước; nếu ô sát trước mặt có đồng minh thì hạn chế (chỉ chéo 1 nếu hợp lệ); có địch đứng
          sát trước mặt thì có thể ăn thẳng.
        </li>
        <li>
          <strong class="text-text-primary">Vua</strong> — 1 ô theo 8 hướng; lượt đầu của vua được
          phép đi thẳng 2 ô nếu ô giữa trống.
        </li>
        <li>
          <strong class="text-text-primary">Đại bàng</strong> — hai mặt: <em>đất</em> (hai chéo phía
          trước, không lùi về phía phe mình); <em>bay</em> (tới ô trống bất kỳ, không ăn; hạ cánh
          thì lật quân). Lật tại chỗ hết lượt, lượt sau mới bay được nếu đang mặt bay. Trên app:
          chọn quân rồi nhấp icon trên <strong class="text-text-primary">ô quân đại bàng</strong>
          hoặc phím
          <kbd class="rounded border border-border-default bg-bg-deep px-1 font-mono text-[10px]"
            >L</kbd
          >
          — không lật bằng nhấp lại ô quân đại bàng.
        </li>
        <li>
          <strong class="text-text-primary">Sát thủ</strong> — đi không ăn: nhảy ô trống
          <em>sau</em> đồng minh trên cùng hàng/cột (có giới hạn khi có nhiều đồng minh). Ăn: nhảy
          bắt quân địch khi nhìn thấy trực tiếp và có ô trống phía sau địch (theo luật chi tiết
          trong engine).
        </li>
      </ul>
    </li>
    <li>
      <p class="font-display font-semibold text-text-primary">Kết thúc (trong app)</p>
      <p class="mt-1">
        <strong class="text-text-primary">Chiếu hết</strong> — thua.
        <strong class="text-text-primary">Hòa</strong> khi hết nước đi mà không bị chiếu
        (stalemate). Các luật hòa FIDE (lặp thế, 50 nước…) có thể bổ sung sau.
      </p>
    </li>
    <li>
      <p class="font-display font-semibold text-text-primary">Ghi ván (PGN)</p>
      <p class="mt-1">
        Có thể xuất / nhập ván theo kiểu gần
        <strong class="text-text-primary">đại số dài FIDE</strong>
        (<code class="text-accent-sky/90">Nd5-f6</code>,
        <code class="text-accent-sky/90">e3-e4</code> cho tốt) hoặc chỉ tọa độ
        <code class="text-accent-sky/90">a1-b2</code>; chiếu / chiếu hết thêm
        <code class="text-accent-sky/90">+</code> / <code class="text-accent-sky/90">#</code>.
      </p>
    </li>
    <li>
      <p class="font-display font-semibold text-text-primary">Thế cờ (FEN)</p>
      <p class="mt-1">
        Có thể <strong class="text-text-primary">đặt bàn từ một dòng FEN</strong> (bàn 9×11 + lượt +
        quyền vua đi 2 ô) — bổ sung cho PGN; không thay thế danh sách nước. Chi tiết ký hiệu quân
        trên bàn cờ.
      </p>
    </li>
  </ul>
</template>
