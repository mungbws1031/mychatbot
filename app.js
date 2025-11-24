const storageKey = 'design-confirm-requests';

const generateId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  // Fallback: simple RFC4122-ish random generator for non-secure contexts
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
};

const defaults = [
  {
    id: generateId(),
    title: '모바일 온보딩 리디자인',
    requester: 'Growth 팀',
    designer: '민지',
    dueDate: '2024-08-02',
    link: 'https://www.figma.com/file/onboarding',
    notes: '주요 KPI는 전환율 +15%. 페르소나는 신규 가입자 중심.',
    status: 'pending',
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    title: '콘텐츠 상세 페이지 QA',
    requester: '콘텐츠 스쿼드',
    designer: '준호',
    dueDate: '2024-07-25',
    link: '',
    notes: 'PC/모바일 레이아웃 간격 확인, 접근성 대비 체크 필요.',
    status: 'changes',
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    title: '다크 모드 토큰 정리',
    requester: 'DesignOps',
    designer: '수아',
    dueDate: '2024-07-30',
    link: 'https://notion.so/darkmode',
    notes: '컴포넌트별 명명 규칙을 문서화하고 토큰 샘플 제공.',
    status: 'approved',
    updatedAt: new Date().toISOString(),
  },
];

const form = document.getElementById('design-form');
const list = document.getElementById('request-list');
const stats = document.getElementById('stats');
const statusFilter = document.getElementById('status-filter');
const searchInput = document.getElementById('search');
const clearButton = document.getElementById('clear-data');
const template = document.getElementById('row-template');

function loadRequests() {
  const stored = localStorage.getItem(storageKey);
  if (!stored) return [...defaults];
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [...defaults];
  } catch (err) {
    console.error('데이터를 불러오지 못했습니다', err);
    return [...defaults];
  }
}

function saveRequests(items) {
  localStorage.setItem(storageKey, JSON.stringify(items));
}

function statusLabel(status) {
  switch (status) {
    case 'approved':
      return '컨펌';
    case 'changes':
      return '수정 요청';
    default:
      return '대기';
  }
}

function formatDate(value) {
  if (!value) return '날짜 없음';
  const date = new Date(value);
  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

function timeAgo(value) {
  const now = new Date();
  const then = new Date(value);
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return '방금 전 업데이트';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전 업데이트`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전 업데이트`;
  return `${Math.floor(diff / 86400)}일 전 업데이트`;
}

function updateStats(items) {
  const counts = items.reduce(
    (acc, item) => {
      acc[item.status] += 1;
      return acc;
    },
    { pending: 0, changes: 0, approved: 0 },
  );

  stats.innerHTML = '';
  const entries = [
    { key: 'pending', label: '대기', color: '#60a5fa' },
    { key: 'changes', label: '수정 요청', color: '#fb7185' },
    { key: 'approved', label: '컨펌', color: '#34d399' },
  ];

  entries.forEach(({ key, label, color }) => {
    const badge = document.createElement('span');
    badge.className = 'badge';
    badge.innerHTML = `<span class="badge-dot" style="background:${color}"></span>${label} ${counts[key]}`;
    stats.appendChild(badge);
  });
}

function render(items) {
  const search = searchInput.value.toLowerCase();
  const status = statusFilter.value;

  const filtered = items.filter((item) => {
    const matchStatus = status === 'all' || item.status === status;
    const matchSearch =
      item.title.toLowerCase().includes(search) ||
      item.requester.toLowerCase().includes(search) ||
      item.designer.toLowerCase().includes(search);
    return matchStatus && matchSearch;
  });

  list.innerHTML = '';
  if (!filtered.length) {
    list.innerHTML = '<p class="hint">조건에 맞는 요청이 없습니다.</p>';
  }

  filtered.forEach((item) => {
    const row = template.content.cloneNode(true);
    const article = row.querySelector('.row');
    article.dataset.id = item.id;

    row.querySelector('.title').textContent = item.title;
    const statusBadge = row.querySelector('.badge.status');
    statusBadge.textContent = statusLabel(item.status);
    statusBadge.classList.add(item.status);

    const meta = row.querySelector('.meta');
    meta.textContent = `${item.requester} · ${item.designer} · 마감 ${formatDate(item.dueDate)} · ${timeAgo(item.updatedAt)}`;

    const notes = row.querySelector('.notes');
    notes.textContent = item.notes || '메모가 없습니다.';

    const links = row.querySelector('.links');
    if (item.link) {
      const anchor = document.createElement('a');
      anchor.href = item.link;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      anchor.textContent = '자료 확인';
      links.appendChild(anchor);
    }

    list.appendChild(row);
  });

  updateStats(items);
}

function persistAndRender(updater) {
  const current = loadRequests();
  const updated = updater([...current]);
  saveRequests(updated);
  render(updated);
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());
  const newItem = {
    id: crypto.randomUUID(),
    title: data.title.trim(),
    requester: data.requester.trim(),
    designer: data.designer.trim(),
    dueDate: data.dueDate,
    link: data.link.trim(),
    notes: data.notes.trim(),
    status: 'pending',
    updatedAt: new Date().toISOString(),
  };

  persistAndRender((items) => [newItem, ...items]);
  form.reset();
});

list.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  const row = button.closest('.row');
  const id = row?.dataset.id;
  if (!id) return;

  if (button.classList.contains('delete')) {
    persistAndRender((items) => items.filter((item) => item.id !== id));
    return;
  }

  let nextStatus = null;
  if (button.classList.contains('approve')) nextStatus = 'approved';
  if (button.classList.contains('request-changes')) nextStatus = 'changes';
  if (button.classList.contains('pending')) nextStatus = 'pending';

  if (!nextStatus) return;

  persistAndRender((items) =>
    items.map((item) =>
      item.id === id
        ? { ...item, status: nextStatus, updatedAt: new Date().toISOString() }
        : item,
    ),
  );
});

statusFilter.addEventListener('change', () => render(loadRequests()));
searchInput.addEventListener('input', () => render(loadRequests()));

clearButton.addEventListener('click', () => {
  if (!confirm('저장된 데이터를 초기화할까요?')) return;
  saveRequests(defaults);
  render(loadRequests());
});

render(loadRequests());
