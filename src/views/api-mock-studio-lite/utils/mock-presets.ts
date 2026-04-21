import type { MockRule, RequestDraft } from '../types'

import { createBodyMatcher, createId, createMatcher, createPair, createStatusEntry } from './mock-engine'

export function createBlankRule(): MockRule {
  const statusEntry = createStatusEntry('ok', 200, 'Mock success', '{\n  "ok": true\n}')
  return {
    id: createId('rule'),
    name: 'New mock rule',
    description: 'Rule mới để mô phỏng endpoint tùy ý.',
    enabled: true,
    method: 'ANY',
    endpointPattern: '/api/*',
    queryMatchers: [],
    headerMatchers: [],
    bodyMatchers: [],
    statusSelectorHeader: 'x-mock-status',
    statusSelectorQuery: 'status',
    statusSelectorBodyPath: 'statusKey',
    statusMap: [statusEntry],
    defaultStatusKey: statusEntry.key,
  }
}

export function createDefaultRules(): MockRule[] {
  const tasksRule: MockRule = {
    id: createId('rule'),
    name: 'Tasks list mock',
    description: 'Mô phỏng endpoint danh sách công việc cho frontend team.',
    enabled: true,
    method: 'GET',
    endpointPattern: '/api/tasks*',
    queryMatchers: [createMatcher('team', 'frontend')],
    headerMatchers: [createMatcher('x-role', 'dev')],
    bodyMatchers: [],
    statusSelectorHeader: 'x-mock-status',
    statusSelectorQuery: 'status',
    statusSelectorBodyPath: 'statusKey',
    statusMap: [
      createStatusEntry(
        'ok',
        200,
        'Danh sách tasks đã sẵn sàng',
        '{\n  "items": [\n    { "id": 101, "title": "Ship onboarding", "owner": "{{query.team}}" },\n    { "id": 102, "title": "Fix flaky test", "owner": "{{header.x-role}}" }\n  ],\n  "meta": { "requestedAt": "{{timestamp}}" }\n}',
      ),
      createStatusEntry('forbidden', 403, 'Không có quyền truy cập', '{\n  "error": "forbidden",\n  "path": "{{request.endpoint}}"\n}'),
      createStatusEntry('slow', 200, 'Backend đang chậm', '{\n  "items": [],\n  "notice": "simulate slow backend"\n}'),
    ],
    defaultStatusKey: 'ok',
  }

  const loginRule: MockRule = {
    id: createId('rule'),
    name: 'Login mock',
    description: 'Mô phỏng đăng nhập với body matcher cho email.',
    enabled: true,
    method: 'POST',
    endpointPattern: '/api/login',
    queryMatchers: [],
    headerMatchers: [createMatcher('x-client', '*')],
    bodyMatchers: [createBodyMatcher('email', 're:.*@company\\.com$')],
    statusSelectorHeader: 'x-mock-status',
    statusSelectorQuery: 'status',
    statusSelectorBodyPath: 'statusKey',
    statusMap: [
      createStatusEntry('ok', 200, 'Đăng nhập thành công', '{\n  "token": "mock.jwt.token",\n  "user": { "email": "{{body.email}}" }\n}'),
      createStatusEntry('invalid', 422, 'Dữ liệu chưa hợp lệ', '{\n  "error": "validation_error",\n  "field": "email"\n}'),
      createStatusEntry('locked', 423, 'Tài khoản tạm khóa', '{\n  "error": "account_locked"\n}'),
    ],
    defaultStatusKey: 'ok',
  }

  return [tasksRule, loginRule]
}

export function createDefaultRequestDraft(): RequestDraft {
  return {
    method: 'GET',
    endpoint: '/api/tasks',
    query: [createPair('team', 'frontend'), createPair('status', 'ok')],
    headers: [createPair('x-role', 'dev'), createPair('x-client', 'web')],
    body: '{\n  "statusKey": "ok"\n}',
  }
}
