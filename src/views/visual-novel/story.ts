import type { StoryData } from './types'

const story: StoryData = {
  title: 'Đêm Trăng Huyết',
  characters: [
    {
      id: 'minh',
      name: 'Minh',
      sprites: {
        neutral: '/visual-novel/minh-neutral.png',
        serious: '/visual-novel/minh-serious.png',
        scared: '/visual-novel/minh-scared.png',
      },
    },
    {
      id: 'linh',
      name: 'Linh',
      sprites: {
        neutral: '/visual-novel/linh-neutral.png',
        serious: '/visual-novel/linh-serious.png',
        scared: '/visual-novel/linh-scared.png',
      },
    },
  ],
  scenes: [
    {
      id: 'scene1',
      background: '/visual-novel/bg-bamboo-forest.png',
      bgTransition: 'fade-through-black',
      stage: [{ characterId: 'minh', sprite: 'neutral', position: 'center', animation: 'fade-in' }],
      dialogue: [
        {
          text: 'Rừng trúc yên tĩnh dưới ánh trăng bạc. Không khí mát lạnh thấm qua từng lớp áo.',
        },
        {
          characterId: 'minh',
          text: 'Đêm nay khí trời khác lạ... linh khí xung quanh như đang dao động.',
        },
        {
          text: 'Minh nhắm mắt, hít thở đều đặn, cố gắng tập trung vào dòng chảy linh lực trong cơ thể.',
        },
      ],
      next: 'scene2',
    },
    {
      id: 'scene2',
      background: '/visual-novel/bg-bamboo-forest.png',
      effect: 'shake',
      stage: [{ characterId: 'minh', sprite: 'serious', position: 'center' }],
      dialogue: [
        { text: 'Một tiếng động mạnh vang lên từ phía xa, phá vỡ sự tĩnh lặng.' },
        {
          characterId: 'minh',
          text: 'Cái gì thế?!',
        },
        {
          text: 'Minh mở mắt, tay phải đã nắm chặt chuôi kiếm. Giữa những thân trúc, một bóng người đang loạng choạng tiến lại.',
        },
      ],
      next: 'scene3',
    },
    {
      id: 'scene3',
      background: '/visual-novel/bg-bamboo-forest.png',
      stage: [
        { characterId: 'minh', sprite: 'serious', position: 'left' },
        { characterId: 'linh', sprite: 'scared', position: 'right', animation: 'slide-in' },
      ],
      dialogue: [
        {
          text: 'Một cô gái mặc trang phục đen đỏ xuất hiện, người đầy vết thương, bước đi không vững.',
        },
        {
          characterId: 'linh',
          text: 'Xin... xin hãy giúp tôi... Chúng đang đuổi theo...',
        },
        {
          characterId: 'minh',
          text: '...',
        },
        {
          text: 'Đôi mắt cô gái đầy sợ hãi nhưng ánh nhìn vẫn giữ một vẻ kiên quyết kỳ lạ.',
        },
      ],
      choices: [
        { label: 'Giúp cô ấy', next: 'scene4a' },
        { label: 'Cảnh giác, hỏi rõ trước', next: 'scene4b' },
      ],
    },
    {
      id: 'scene4a',
      background: '/visual-novel/bg-temple-ruins.jpg',
      bgTransition: 'fade-through-black',
      effect: 'glow',
      stage: [
        { characterId: 'minh', sprite: 'neutral', position: 'left', animation: 'fade-in' },
        { characterId: 'linh', sprite: 'neutral', position: 'right', animation: 'fade-in' },
      ],
      dialogue: [
        {
          characterId: 'minh',
          text: 'Đưa tay đây. Tôi sẽ dùng linh lực chữa trị cho cô.',
        },
        {
          text: 'Minh đặt tay lên vai cô gái, một luồng linh lực ấm áp lan tỏa. Vết thương dần khép lại.',
        },
        {
          characterId: 'linh',
          text: 'Cảm ơn... Tôi tên Linh. Tôi không phải người thường.',
        },
        {
          characterId: 'minh',
          text: 'Tôi biết. Linh khí của cô khác biệt. Cô là ai?',
        },
      ],
      next: 'scene5a',
    },
    {
      id: 'scene5a',
      background: '/visual-novel/bg-mountain-moonlight.jpg',
      bgTransition: 'crossfade',
      effect: 'flash',
      stage: [{ characterId: 'linh', sprite: 'neutral', position: 'center', animation: 'fade-in' }],
      dialogue: [
        {
          characterId: 'linh',
          text: 'Tôi là hộ pháp linh thú của ngọn núi này. Đêm nay, trăng huyết xuất hiện, kết giới bảo vệ đã suy yếu.',
        },
        {
          text: 'Ánh trăng đổi sang sắc đỏ thẫm. Linh hiện nguyên hình — một vầng sáng dịu dàng bao quanh cô.',
        },
        {
          characterId: 'linh',
          text: 'Nhờ có anh, tôi đã hồi phục đủ sức để khôi phục kết giới. Ngọn núi này sẽ được bình yên.',
        },
        {
          characterId: 'minh',
          text: 'Hóa ra thế... Vậy hãy để tôi giúp cô bảo vệ nơi này.',
        },
        {
          text: 'Dưới ánh trăng huyết, hai người đứng bên nhau trên đỉnh núi. Kết giới rực sáng trở lại, bao phủ cả vùng rừng trúc.',
        },
      ],
      isEnding: true,
      endingTitle: 'Kết thúc 1: Hộ Pháp Linh Sơn',
    },
    {
      id: 'scene4b',
      background: '/visual-novel/bg-bamboo-forest.png',
      stage: [
        { characterId: 'minh', sprite: 'serious', position: 'left' },
        { characterId: 'linh', sprite: 'serious', position: 'right' },
      ],
      dialogue: [
        {
          characterId: 'minh',
          text: 'Khoan đã. Ai đang đuổi cô? Cô là người hay yêu?',
        },
        {
          characterId: 'linh',
          text: '...Anh thông minh đấy. Tôi không phải người. Nhưng tôi cũng không phải kẻ xấu.',
        },
        {
          characterId: 'minh',
          text: 'Chưa đủ để tôi tin. Nói rõ hơn đi.',
        },
        {
          characterId: 'linh',
          text: 'Tôi là hộ pháp linh thú. Đêm nay trăng huyết xuất hiện, có kẻ muốn phá kết giới của ngọn núi này. Tôi bị thương khi cố ngăn chúng.',
        },
      ],
      choices: [
        { label: 'Tin cô ấy, cùng chiến đấu', next: 'scene5c' },
        { label: 'Bỏ đi, không liên quan', next: 'scene5d' },
      ],
    },
    {
      id: 'scene5c',
      background: '/visual-novel/bg-cliff-blood-moon.jpg',
      bgTransition: 'fade-through-black',
      effect: 'red-tint',
      stage: [
        { characterId: 'minh', sprite: 'serious', position: 'left', animation: 'slide-in' },
        { characterId: 'linh', sprite: 'serious', position: 'right', animation: 'slide-in' },
      ],
      dialogue: [
        {
          characterId: 'minh',
          text: 'Được rồi, tôi tin cô. Dẫn đường đi.',
        },
        {
          text: 'Trên vách đá cheo leo, trăng huyết đỏ rực treo giữa bầu trời. Bóng tối cuồn cuộn phía dưới thung lũng.',
        },
        {
          characterId: 'linh',
          text: 'Chúng ở ngay phía dưới. Anh sẵn sàng chưa?',
        },
        {
          characterId: 'minh',
          text: 'Luôn sẵn sàng.',
        },
        {
          text: 'Hai người lao xuống giữa màn đêm đỏ. Tiếng kiếm vang lên xé toạc bóng tối. Trận chiến dưới trăng huyết bắt đầu.',
        },
      ],
      isEnding: true,
      endingTitle: 'Kết thúc 2: Trận Chiến Trăng Huyết',
    },
    {
      id: 'scene5d',
      background: '/visual-novel/bg-forest-path-dawn.jpg',
      bgTransition: 'fade-through-black',
      stage: [{ characterId: 'minh', sprite: 'neutral', position: 'center', animation: 'fade-in' }],
      dialogue: [
        {
          characterId: 'minh',
          text: 'Chuyện của núi này, không phải chuyện của tôi. Xin lỗi.',
        },
        {
          text: 'Minh quay lưng bước đi. Phía sau, ánh mắt Linh thoáng buồn nhưng không oán trách.',
        },
        {
          characterId: 'linh',
          text: 'Tôi hiểu. Cảm ơn anh đã dừng lại lắng nghe.',
        },
        {
          text: 'Khi bình minh lên, Minh bước trên con đường rừng vắng. Phía xa, ánh sáng đỏ từ ngọn núi vụt tắt — kết giới đã sụp đổ hay được khôi phục, anh không biết.',
        },
        {
          text: 'Nhưng trong lòng, có điều gì đó cứ vương vấn mãi không thôi.',
        },
      ],
      isEnding: true,
      endingTitle: 'Kết thúc 3: Kẻ Qua Đường',
    },
  ],
}

export default story
