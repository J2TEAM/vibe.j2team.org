import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import RolePanel from '../components/RolePanel.vue'
import { createRoom, projectRoom } from '../utils/engine'

describe('Giao diện theo vai', () => {
  it('chỉ dịch manh mối trước mở khóa, nhận khóa không nguyên an toàn và render tin như văn bản', async () => {
    const room = createRoom('room-ui', 'Duc', 'caesar')
    room.round = 1
    room.phase = 'intercept'
    room.caesarKey = 3
    room.originalText = 'Hãy chọn cửa 3. <b>Không thực thi HTML</b>'
    const wrapper = mount(RolePanel, {
      props: {
        view: projectRoom(room, 'p2'),
        busy: false,
        remaining: 45,
        receivedText: null,
        sentText: '',
        receiptStatus: 'plain',
        cryptoReady: false,
      },
      global: { stubs: { Icon: true } },
    })
    expect(wrapper.find('[data-testid="intercepted-message"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="modified-message"]').exists()).toBe(false)
    await wrapper.get('[data-testid="caesar-key"]').setValue('3')
    expect(wrapper.get('[data-testid="caesar-preview"]').text()).toBe('HELLO')
    expect(wrapper.find('[data-testid="modified-message"]').exists()).toBe(false)
    await wrapper.get('[data-testid="caesar-key"]').setValue('1.5')
    expect(wrapper.get('[data-testid="caesar-preview"]').text()).toContain('khóa nguyên')
    expect(wrapper.get('[data-testid="unlock-caesar"]').attributes('disabled')).toBeDefined()
    room.unlocked = true
    await wrapper.setProps({ view: projectRoom(room, 'p2') })
    expect(wrapper.get('[data-testid="intercepted-message"]').text()).toBe(room.originalText)
    expect(wrapper.find('b').exists()).toBe(false)
    wrapper.unmount()
  })

  it('B không có cửa để chọn khi bản tin chưa đến hoặc xác thực thất bại', async () => {
    const room = createRoom('room-ui', 'Duc', 'authenticated')
    room.round = 1
    room.phase = 'intercept'
    const wrapper = mount(RolePanel, {
      props: {
        view: projectRoom(room, 'p1'),
        busy: false,
        remaining: 45,
        receivedText: null,
        sentText: '',
        receiptStatus: 'waiting',
        cryptoReady: true,
      },
      global: { stubs: { Icon: true } },
    })
    expect(wrapper.find('[data-testid="choose-door-1"]').exists()).toBe(false)
    room.phase = 'decide'
    await wrapper.setProps({ view: projectRoom(room, 'p1'), receiptStatus: 'invalid' })
    expect(wrapper.find('[data-testid="choose-door-1"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="authentication-failed"]').text()).toContain(
      'AES-GCM đã từ chối',
    )
    await wrapper.setProps({ receiptStatus: 'verified', receivedText: 'B mở cửa 2 <img src=x>' })
    expect(wrapper.find('[data-testid="choose-door-2"]').exists()).toBe(true)
    expect(wrapper.get('[data-testid="received-message"]').text()).toContain('<img src=x>')
    expect(wrapper.find('img').exists()).toBe(false)
    wrapper.unmount()
  })
})
