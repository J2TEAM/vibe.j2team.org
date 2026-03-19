<script setup lang="ts">
import { computed } from 'vue'
import type { Sao, Cung } from './lib/canchi-engine'
import SaoTooltip from './SaoTooltip.vue'
import VoChinhDieuTooltip from './VoChinhDieuTooltip.vue'
import CungTooltip from './CungTooltip.vue'

const props = defineProps<{
  cung: Cung
  highlight?: 'in-tam-phuong' | 'dimmed' | null
}>()

const emit = defineEmits<{
  hover: []
  leave: []
}>()

const CUNG_NGU_HANH: Record<number, string> = {
  1: 'thuy',
  2: 'tho',
  3: 'moc',
  4: 'moc',
  5: 'tho',
  6: 'hoa',
  7: 'hoa',
  8: 'tho',
  9: 'kim',
  10: 'kim',
  11: 'tho',
  12: 'thuy',
}

const SAO_PHU_QUAN_TRONG = new Set([
  'Tả Phù',
  'Hữu Bật',
  'Văn Xương',
  'Văn Khúc',
  'Thiên Khôi',
  'Thiên Việt',
  'Lộc Tồn',
  'Thiên Mã',
  'Kình Dương',
  'Đà La',
  'Hỏa Tinh',
  'Linh Tinh',
  'Địa Không',
  'Địa Kiếp',
  'Hồng Loan',
  'Thiên Hỷ',
  'Thiên Không',
  'Thiên Hình',
  'Cô Thần',
  'Quả Tú',
  'Thiên Diêu',
  'Hóa Lộc',
  'Hóa Quyền',
  'Hóa Khoa',
  'Hóa Kỵ',
])

const nguHanhColorClass: Record<string, string> = {
  hoa: 'text-red-400',
  moc: 'text-emerald-400',
  tho: 'text-amber-400',
  kim: 'text-zinc-300',
  thuy: 'text-sky-400',
}

const dacTinhDisplay: Record<string, string> = { M: 'M', V: 'V', D: 'Đ', H: 'H', B: 'B' }

function getSaoColorClass(sao: Sao) {
  return sao.nguHanh ? nguHanhColorClass[sao.nguHanh] || 'text-text-primary' : 'text-text-primary'
}

function getSaoWeightClass(sao: Sao, isChinhTinh: boolean) {
  if (isChinhTinh) return 'font-bold'
  if (SAO_PHU_QUAN_TRONG.has(sao.ten)) return 'font-semibold'
  return 'font-normal'
}

function getDacTinhText(sao: Sao) {
  return sao.dacTinh ? ` (${dacTinhDisplay[sao.dacTinh] || sao.dacTinh})` : ''
}

function sortByImportance(a: Sao, b: Sao) {
  return (SAO_PHU_QUAN_TRONG.has(a.ten) ? 0 : 1) - (SAO_PHU_QUAN_TRONG.has(b.ten) ? 0 : 1)
}

const saoPhuTot = computed(() =>
  props.cung.saoPhu.filter((s) => s.isTot !== false).sort(sortByImportance),
)

const saoPhuXau = computed(() =>
  props.cung.saoPhu.filter((s) => s.isTot === false).sort(sortByImportance),
)

const NGU_HANH_LABEL: Record<string, string> = {
  kim: 'Kim',
  moc: 'Mộc',
  thuy: 'Thủy',
  hoa: 'Hỏa',
  tho: 'Thổ',
}

const CUNG_NGU_HANH_MAP: Record<number, string> = {
  1: 'thuy',
  2: 'tho',
  3: 'moc',
  4: 'moc',
  5: 'tho',
  6: 'hoa',
  7: 'hoa',
  8: 'tho',
  9: 'kim',
  10: 'kim',
  11: 'tho',
  12: 'thuy',
}

function getNguHanhCung(viTri: number): string {
  const key = CUNG_NGU_HANH_MAP[viTri]
  return key ? NGU_HANH_LABEL[key] || '' : ''
}

const CUNG_MENH_DESC: Record<string, string> = {
  Mệnh: 'Bản mệnh — tính cách, ngoại hình, tư chất, vận mệnh tổng quát cả đời.',
  'Phụ mẫu': 'Cha mẹ — quan hệ với song thân, sự giáo dục, gia phong.',
  'Phúc đức': 'Phúc đức — phúc phần tổ tiên để lại, đời sống tinh thần, tâm linh.',
  'Điền trạch': 'Điền trạch — nhà cửa, bất động sản, tài sản cố định.',
  'Quan lộc': 'Quan lộc — sự nghiệp, công danh, nghề nghiệp.',
  'Nô bộc': 'Nô bộc (Giao hữu) — bạn bè, thuộc hạ, đồng nghiệp.',
  'Thiên di': 'Thiên di — hoạt động bên ngoài, xuất ngoại, di chuyển.',
  'Tật ách': 'Tật ách — sức khoẻ, bệnh tật, tai nạn, thể chất.',
  'Tài bạch': 'Tài bạch — tiền bạc, thu nhập, cách kiếm tiền.',
  'Tử tức': 'Tử tức — con cái, hậu duệ, khả năng sinh sản.',
  'Phu thê': 'Phu thê — hôn nhân, vợ/chồng, đối tác tình cảm.',
  'Huynh đệ': 'Huynh đệ — anh chị em, bạn cùng trang lứa.',
}

const TRANG_SINH_DESC: Record<string, string> = {
  'Tràng sinh': 'Khởi đầu mạnh mẽ, sinh sôi, phát triển.',
  'Mộc dục': 'Giai đoạn tắm rửa, thay đổi, bất ổn nhẹ.',
  'Quan đới': 'Đội mũ áo, bắt đầu ra đời, trưởng thành.',
  'Lâm quan': 'Gần ngưỡng thành tựu, vững vàng.',
  'Đế vượng': 'Cực thịnh, đỉnh cao năng lượng.',
  Suy: 'Bắt đầu suy giảm, cần cẩn trọng.',
  Bệnh: 'Sức lực yếu, dễ gặp trở ngại.',
  Tử: 'Ngưng trệ, khó tiến triển.',
  Mộ: 'Cất giấu, tiềm ẩn, tích lũy.',
  Tuyệt: 'Kết thúc một chu kỳ, cạn kiệt.',
  Thai: 'Manh nha, bắt đầu hình thành mới.',
  Dưỡng: 'Nuôi dưỡng, chuẩn bị cho chu kỳ mới.',
}
</script>

<template>
  <div
    class="cung-cell"
    :class="{ 'cung-dimmed': highlight === 'dimmed' }"
    @mouseenter="emit('hover')"
    @mouseleave="emit('leave')"
  >
    <!-- Header: Can Chi, Tên cung, Đại hạn -->
    <div class="cung-header">
      <CungTooltip :label="`${cung.canCung} ${cung.chiCung}`">
        <template #content>
          <p>
            Thiên can: <b>{{ cung.canCung }}</b>
          </p>
          <p>
            Địa chi: <b>{{ cung.chiCung }}</b>
          </p>
          <p>
            Ngũ hành cung: <b>{{ getNguHanhCung(cung.viTri) }}</b>
          </p>
        </template>
        <span class="font-semibold" :class="nguHanhColorClass[CUNG_NGU_HANH[cung.viTri] || 'thuy']"
          >{{ cung.canCung.charAt(0) }}.{{ cung.chiCung }}</span
        >
      </CungTooltip>

      <div class="flex items-center gap-1">
        <CungTooltip :label="cung.tenCungMenh">
          <template #content>
            <p>{{ CUNG_MENH_DESC[cung.tenCungMenh] || '' }}</p>
            <p v-if="cung.isThan" class="mt-1 font-semibold text-text-primary">
              ☆ Cung này an Thân — ảnh hưởng lớn đến hậu vận.
            </p>
          </template>
          <span class="cung-name">{{ cung.tenCungMenh }}</span>
        </CungTooltip>
        <CungTooltip v-if="cung.isThan" label="Thân cung">
          <template #content>
            <p>Thân cư {{ cung.tenCungMenh }} — quyết định hậu vận (sau 30 tuổi).</p>
          </template>
          <span class="px-1 bg-accent-coral text-bg-deep text-[10px] font-semibold">Thân</span>
        </CungTooltip>
      </div>

      <CungTooltip label="Đại hạn">
        <template #content>
          <p>
            Tuổi bắt đầu đại hạn tại cung này:
            <b class="text-accent-coral">{{ cung.daiHan }} tuổi</b>. Mỗi đại hạn kéo dài 10 năm.
          </p>
        </template>
        <span class="font-semibold text-text-secondary">{{ cung.daiHan }}</span>
      </CungTooltip>
    </div>

    <!-- Chính tinh -->
    <div
      class="flex flex-col items-center justify-center gap-0.5"
      style="height: 3rem; overflow: visible"
    >
      <template v-if="cung.saoChinhTinh.length > 0">
        <SaoTooltip v-for="sao in cung.saoChinhTinh" :key="sao.id" :sao="sao">
          <p
            :class="[
              'text-lg text-center cursor-help',
              getSaoColorClass(sao),
              getSaoWeightClass(sao, true),
            ]"
          >
            {{ sao.ten }}{{ getDacTinhText(sao) }}
          </p>
        </SaoTooltip>
      </template>
      <VoChinhDieuTooltip v-else :cung="cung" />
    </div>

    <!-- Sao phụ - 2 cột -->
    <div class="flex flex-1 justify-between gap-2 px-1">
      <div class="flex flex-col items-start min-h-52">
        <SaoTooltip v-for="sao in saoPhuTot" :key="sao.id" :sao="sao">
          <p
            :class="[
              'text-[15px] capitalize cursor-help',
              getSaoColorClass(sao),
              getSaoWeightClass(sao, false),
            ]"
          >
            {{ sao.ten }}{{ getDacTinhText(sao) }}
          </p>
        </SaoTooltip>
      </div>
      <div class="flex flex-col items-start min-h-52">
        <SaoTooltip v-for="sao in saoPhuXau" :key="sao.id" :sao="sao">
          <p
            :class="[
              'text-[15px] capitalize cursor-help',
              getSaoColorClass(sao),
              getSaoWeightClass(sao, false),
            ]"
          >
            {{ sao.ten }}{{ getDacTinhText(sao) }}
          </p>
        </SaoTooltip>
      </div>
    </div>

    <!-- Footer -->
    <div class="cung-footer">
      <CungTooltip label="Tiểu hạn">
        <template #content>
          <p>
            Tiểu hạn lưu niên tại cung <b>{{ cung.chiCung }}</b> ({{
              cung.tieuHan || cung.tenCung
            }}).
          </p>
        </template>
        <span>{{ cung.tieuHan || cung.tenCung }}</span>
      </CungTooltip>

      <CungTooltip label="Tràng Sinh">
        <template #content>
          <p class="font-semibold text-text-primary">{{ cung.trangSinh }}</p>
          <p class="mt-0.5">{{ TRANG_SINH_DESC[cung.trangSinh] || '' }}</p>
          <p class="mt-1 text-[10px] text-text-dim">
            Vòng Tràng Sinh — 12 giai đoạn sinh vượng suy tuyệt của ngũ hành Cục.
          </p>
        </template>
        <span class="font-semibold text-center">{{ cung.trangSinh }}</span>
      </CungTooltip>

      <CungTooltip label="Nguyệt hạn">
        <template #content>
          <p>
            Cung này ứng với <b>tháng {{ cung.nguyetHan || '-' }}</b> (âm lịch) trong lưu nguyệt
            hạn.
          </p>
        </template>
        <span class="font-semibold">T.{{ cung.nguyetHan || '-' }}</span>
      </CungTooltip>
    </div>
  </div>
</template>
