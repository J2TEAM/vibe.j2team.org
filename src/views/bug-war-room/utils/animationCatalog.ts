export interface AnimationCatalogAssets {
  slimeIdleSvg: string
  slimeAnnoyedSvg: string
  slimeClickReactionSvg: string
  actionConfirmSvg: string
  trustUpSvg: string
  stabilityUpSvg: string
  chaosUpSvg: string
  energyLowSvg: string
  warningSvg: string
  criticalSvg: string
  victorySvg: string
  defeatSvg: string
  slimeTeachingSvg: string
}

export interface AnimationCatalogItem {
  id: string
  title: string
  fileName: string
  description: string
  triggerCondition: string
  operatorHint?: string
  asset: string
}

export function createAnimationCatalogItems(options: {
  slimeSpamWindowMs: number
  slimeSpamAnnoyedThreshold: number
  slimeClickReactionDurationMs: number
  assets: AnimationCatalogAssets
}): AnimationCatalogItem[] {
  const {
    slimeSpamWindowMs,
    slimeSpamAnnoyedThreshold,
    slimeClickReactionDurationMs,
    assets,
  } = options

  return [
    {
      id: 'slime-idle',
      title: 'Slime Idle',
      fileName: 'slime-idle.svg',
      description: 'Trạng thái quan sát mặc định khi hệ thống bình ổn.',
      triggerCondition: 'Hiển thị mặc định khi không có hiệu ứng tạm thời và hệ thống chưa vào warning/critical/victory/defeat.',
      asset: assets.slimeIdleSvg,
    },
    {
      id: 'slime-annoyed',
      title: 'Slime Annoyed',
      fileName: 'slime-annoyed.svg',
      description: 'Phản ứng khi người chơi spam thao tác quá nhanh.',
      triggerCondition: `Xuất hiện khi số lần click liên tiếp trong ${Math.round(slimeSpamWindowMs / 1000)} giây đạt ngưỡng spam (${slimeSpamAnnoyedThreshold} lần).`,
      asset: assets.slimeAnnoyedSvg,
    },
    {
      id: 'slime-click-reaction',
      title: 'Slime Click Reaction',
      fileName: 'slime-click-reaction.svg',
      description: 'Hiệu ứng click phản hồi tức thì cho thao tác operator.',
      triggerCondition: 'Xuất hiện khi người chơi click/tap trực tiếp vào Slime Operator và không bị override bởi trạng thái annoyed.',
      operatorHint: `Mỗi lần click nên chờ khoảng ${Math.ceil(slimeClickReactionDurationMs / 1000)} giây để animation chạy trọn vẹn rồi hãy click tiếp.`,
      asset: assets.slimeClickReactionSvg,
    },
    {
      id: 'action-confirm',
      title: 'Action Confirm',
      fileName: 'action-confirm.svg',
      description: 'Xác nhận một quyết định vừa được thực thi.',
      triggerCondition: 'Xuất hiện sau khi chọn một incident action có tác động trung tính hoặc không rơi vào các nhánh trust-up/stability-up/chaos-up/energy-low.',
      asset: assets.actionConfirmSvg,
    },
    {
      id: 'trust-up',
      title: 'Trust Up',
      fileName: 'trust-up.svg',
      description: 'Biểu thị niềm tin người dùng được cải thiện.',
      triggerCondition: 'Xuất hiện khi action vừa chọn có tác động Trust tăng mạnh (T >= +8).',
      asset: assets.trustUpSvg,
    },
    {
      id: 'stability-up',
      title: 'Stability Up',
      fileName: 'stability-up.svg',
      description: 'Biểu thị hệ thống đang quay lại trạng thái ổn định.',
      triggerCondition: 'Xuất hiện khi action vừa chọn có tác động Stability tăng mạnh (S >= +8).',
      asset: assets.stabilityUpSvg,
    },
    {
      id: 'chaos-up',
      title: 'Chaos Up',
      fileName: 'chaos-up.svg',
      description: 'Cảnh báo chaos tăng nhanh sau lựa chọn rủi ro.',
      triggerCondition: 'Xuất hiện khi action làm chaos tăng mạnh (chaosDelta >= 12) hoặc random event làm chaos tăng đáng kể.',
      asset: assets.chaosUpSvg,
    },
    {
      id: 'energy-low',
      title: 'Energy Low',
      fileName: 'energy-low.svg',
      description: 'Trạng thái team suy kiệt năng lượng khi xử lý kéo dài.',
      triggerCondition: 'Xuất hiện khi action làm tiêu hao năng lượng sâu (E <= -10) hoặc Energy hiện tại xuống mức thấp (<= 35).',
      asset: assets.energyLowSvg,
    },
    {
      id: 'warning',
      title: 'Warning',
      fileName: 'warning.svg',
      description: 'Mức cảnh báo cao khi incident bắt đầu mất kiểm soát.',
      triggerCondition: 'Tự động hiển thị khi Chaos >= 65 và chưa chạm mức critical.',
      asset: assets.warningSvg,
    },
    {
      id: 'critical',
      title: 'Critical',
      fileName: 'critical.svg',
      description: 'Báo động đỏ khi hệ thống sát ngưỡng meltdown.',
      triggerCondition: 'Tự động hiển thị khi Chaos >= 85 (trạng thái báo động đỏ).',
      asset: assets.criticalSvg,
    },
    {
      id: 'victory',
      title: 'Victory',
      fileName: 'victory.svg',
      description: 'Hiệu ứng chúc mừng khi kết thúc run thành công.',
      triggerCondition: 'Hiển thị sau khi chiến dịch kết thúc và Campaign Score >= 65.',
      asset: assets.victorySvg,
    },
    {
      id: 'defeat',
      title: 'Defeat',
      fileName: 'defeat.svg',
      description: 'Hiệu ứng thất bại khi chiến dịch vỡ trận.',
      triggerCondition: 'Hiển thị sau khi chiến dịch kết thúc và Campaign Score < 65.',
      asset: assets.defeatSvg,
    },
    {
      id: 'slime-teaching',
      title: 'Slime Teaching',
      fileName: 'slime-teaching.svg',
      description: 'Nhân vật coach trong khu Learning Progress.',
      triggerCondition: 'Hiển thị tĩnh trong khối Learning Coach để dẫn hướng sang Knowledge Blog.',
      asset: assets.slimeTeachingSvg,
    },
  ]
}
