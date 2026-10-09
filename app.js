'use strict';


let metricsData = [];
let rowsData = [];
let notificationsData = [];
let nextId = 9;


const metricsRow = document.getElementById('metricsRow');
const actionsTableBody = document.getElementById('actionsTableBody');
const rowsCounter = document.getElementById('rowsCounter');
const notificationsList = document.getElementById('notificationsList');
const notifBadge = document.getElementById('notifBadge');
const addForm = document.getElementById('addForm');
const actionNameInput = document.getElementById('actionName');
const actionStatusSelect = document.getElementById('actionStatus');
const saveBtn = document.getElementById('saveBtn');
const refreshBtn = document.getElementById('refreshBtn');
const toggleThemeBtn = document.getElementById('toggleThemeBtn');
const toastEl = document.getElementById('saveToast');
const toastTitle = document.getElementById('toastTitle');
const toastBody = document.getElementById('toastBody');


const saveToast = bootstrap.Toast.getOrCreateInstance(toastEl, {
  delay: 3500,
  autohide: true
});


async function loadDashboard() {
  try {
    const res = await fetch('dashboard.json');
    if (!res.ok) throw new Error('Не удалось загрузить dashboard.json');
    const data = await res.json();
    metricsData = data.metrics || [];
    rowsData = data.rows || [];
    if (rowsData.length) {
      nextId = Math.max(...rowsData.map(r => r.id)) + 1;
    }
    renderMetrics();
    renderTable();
  } catch (err) {
    console.error(err);
    metricsRow.innerHTML = `
      <div class="col-12">
        <div class="alert alert-danger">Ошибка загрузки показателей: ${err.message}</div>
      </div>`;
  }
}

async function loadNotifications() {
  try {
    const res = await fetch('notifications.json');
    if (!res.ok) throw new Error('Не удалось загрузить notifications.json');
    notificationsData = await res.json();
    renderNotifications();
  } catch (err) {
    console.error(err);
    notificationsList.innerHTML = `<div class="alert alert-warning">Нет уведомлений</div>`;
  }
}


function renderMetrics() {
  if (!metricsData.length) {
    metricsRow.innerHTML = '<div class="col-12 text-muted">Нет данных</div>';
    return;
  }

  const icons = ['👥', '📋', '⚠️', '✅'];
  metricsRow.innerHTML = metricsData.map((m, i) => `
    <div class="col-12 col-sm-6 col-xl-3">
      <div class="card metric-card h-100 shadow-sm border-0">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <p class="text-muted small mb-1">${m.title}</p>
              <h3 class="card-title mb-0 fw-bold">${m.value}</h3>
            </div>
            <span class="metric-icon">${icons[i] || '📊'}</span>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

function getStatusBadge(status) {
  const map = {
    'Готово': 'success',
    'В работе': 'primary',
    'Новая': 'secondary'
  };
  const color = map[status] || 'secondary';
  return `<span class="badge text-bg-${color}">${status}</span>`;
}

function renderTable() {
  rowsCounter.textContent = `${rowsData.length} записей`;

  if (!rowsData.length) {
    actionsTableBody.innerHTML = `
      <tr>
        <td colspan="3" class="text-center text-muted py-4">Нет операций</td>
      </tr>`;
    return;
  }

  actionsTableBody.innerHTML = rowsData.map(row => `
    <tr>
      <td class="text-muted">#${row.id}</td>
      <td>${row.action}</td>
      <td>${getStatusBadge(row.status)}</td>
    </tr>
  `).join('');
}

function renderNotifications() {
  notifBadge.textContent = notificationsData.length;

  if (!notificationsData.length) {
    notificationsList.innerHTML = '<p class="text-muted">Уведомлений нет</p>';
    return;
  }

  notificationsList.innerHTML = notificationsData.map(n => {
    const alertClass = n.type === 'success' ? 'alert-success' :
                       n.type === 'warning' ? 'alert-warning' : 'alert-info';
    return `
      <div class="alert ${alertClass} d-flex align-items-center gap-2" role="alert">
        <span>${n.text}</span>
      </div>`;
  }).join('');
}


function validateActionName() {
  const value = actionNameInput.value.trim();
  actionNameInput.classList.remove('is-valid', 'is-invalid');

  if (value.length < 3) {
    actionNameInput.classList.add('is-invalid');
    return false;
  }
  actionNameInput.classList.add('is-valid');
  return true;
}


function showToast(title, body, type = 'success') {
  toastTitle.textContent = title;
  toastBody.textContent = body;
  // Меняем цвет заголовка через класс
  toastEl.classList.remove('text-bg-success', 'text-bg-warning', 'text-bg-danger');
  if (type === 'success') toastEl.classList.add('text-bg-success');
  else if (type === 'warning') toastEl.classList.add('text-bg-warning');
  saveToast.show();
}




saveBtn.addEventListener('click', () => {
  if (!validateActionName()) {
    showToast('Ошибка', 'Проверьте обязательные поля', 'warning');
   
    return;
  }

  const newRow = {
    id: nextId++,
    action: actionNameInput.value.trim(),
    status: actionStatusSelect.value
  };

  rowsData.unshift(newRow); 
  renderTable();

  
  addForm.reset();
  actionNameInput.classList.remove('is-valid', 'is-invalid');

  
  const modalInstance = bootstrap.Modal.getOrCreateInstance(document.getElementById('addModal'));
  modalInstance.hide();

  
  const successNotif = notificationsData.find(n => n.type === 'success');
  showToast('Успех', successNotif ? successNotif.text : 'Изменения сохранены', 'success');
});


actionNameInput.addEventListener('input', () => {
  if (actionNameInput.value.length > 0) {
    validateActionName();
  } else {
    actionNameInput.classList.remove('is-valid', 'is-invalid');
  }
});


refreshBtn.addEventListener('click', async () => {
  refreshBtn.disabled = true;
  refreshBtn.textContent = 'Загрузка…';
  await loadDashboard();
  await loadNotifications();
  refreshBtn.disabled = false;
  refreshBtn.textContent = 'Обновить данные';
  showToast('Готово', 'Данные обновлены из JSON', 'success');
});


let themeToggled = false;
toggleThemeBtn.addEventListener('click', () => {
  themeToggled = !themeToggled;
  document.body.classList.toggle('alt-theme', themeToggled);
  toggleThemeBtn.textContent = themeToggled ? 'Вернуть обычный текст' : 'Сменить тему текста';
  showToast('Тема', themeToggled ? 'Альтернативная тема включена' : 'Обычная тема', 'success');
});

// ---------- Инициализация ----------
document.addEventListener('DOMContentLoaded', () => {
  loadDashboard();
  loadNotifications();
});
