/*********************************************************
 * Admin Dashboard V2
 *
 * 負責：
 * 1. Dashboard 初始化
 * 2. Header 載入
 * 3. Alert 區塊
 * 4. KPI 區塊
 * 5. 缺額賽事清單
 * 6. Sidebar
 * 7. Modal
 * 8. Toast
 *********************************************************/

/*********************************************************
 * 初始化
 *********************************************************/
document.addEventListener('DOMContentLoaded', () => {

  guardAdminPage();

  loadHeader();

  loadDashboard();

});

/*********************************************************
 * Header
 *********************************************************/
function loadHeader(){

  fetch('header.html')
    .then(res => res.text())
    .then(html => {

      const container =
        document.getElementById(
          'header-container'
        );

      if(container){
        container.innerHTML = html;
      }

      if (window.lucide){
        lucide.createIcons();
      }

    });

}

/*********************************************************
 * Dashboard 主入口
 *********************************************************/
function loadDashboard(){

  callApi({
    action:'getAdminDashboardData'
  }, renderDashboard);

}

/*********************************************************
 * Dashboard Render
 *********************************************************/
function renderDashboard(data){

  console.log(
    'dashboard=',
    data
  );

  if(
    !data ||
    data.result !== 'ok'
  ){
    showToast('Dashboard 載入失敗');
    return;
  }

  renderAlerts(data);

  renderMatchStats(data);

  renderPeopleStats(data);

  renderVacancyGames(data);

}

/*********************************************************
 * Alert 區塊
 *********************************************************/
function renderAlerts(data){

  const alerts =
    data.alerts || {};

  setText(
    'alertJudgeCount',
    alerts.judgeShortageGames || 0
  );

  setText(
    'alertRecordCount',
    alerts.recordShortageGames || 0
  );

  setText(
    'alertPendingCount',
    alerts.pendingConfirm || 0
  );

  setText(
    'sidebarJudgeShortage',
    `${alerts.judgeShortageGames || 0} 缺額`
  );

}

/*********************************************************
 * 賽事 KPI
 *********************************************************/
function renderMatchStats(data){

  const stats =
    data.matchStats || {};

  const total =
    Number(
      stats.totalGames || 0
    );

  const completed =
    Number(
      stats.completedGames || 0
    );

  const pending =
    Number(
      stats.pendingGames || 0
    );

  const week =
    Number(
      stats.weekGames || 0
    );

  setText(
    'totalGames',
    total
  );

  setText(
    'completedGames',
    completed
  );

  setText(
    'pendingGames',
    pending
  );

  setText(
    'weekGames',
    week
  );

  const progress =
    total > 0
      ? Math.round(
          completed / total * 100
        )
      : 0;

  setText(
    'completedRate',
    `${progress}% 執行率`
  );

  setText(
    'seasonProgressText',
    `賽季進度：${progress}%`
  );

  const completedBar =
    document.getElementById(
      'completedBar'
    );

  const pendingBar =
    document.getElementById(
      'pendingBar'
    );

  const weekBar =
    document.getElementById(
      'weekBar'
    );

  if(completedBar){
    completedBar.style.width =
      `${progress}%`;
  }

  if(pendingBar){
    pendingBar.style.width =
      `${100-progress}%`;
  }

  if(weekBar){
    weekBar.style.width =
      `${Math.min(week * 10,100)}%`;
  }

}

/*********************************************************
 * 人員 KPI
 *********************************************************/
function renderPeopleStats(data){

  const stats =
    data.peopleStats || {};

  setText(
    'totalUsers',
    stats.totalUsers || 0
  );

  setText(
    'totalJudges',
    stats.totalJudges || 0
  );

  setText(
    'totalRecords',
    stats.totalRecords || 0
  );

  setText(
    'totalAdmins',
    stats.totalAdmins || 0
  );

}

/*********************************************************
 * 缺額賽事表格
 *********************************************************/
function renderVacancyGames(data){

  const tbody =
    document.getElementById(
      'vacancy-table-body'
    );

  if(!tbody){
    return;
  }

  const games =
    data.vacancyGames || [];

  if(!games.length){

    tbody.innerHTML = `
      <tr>
        <td colspan="6"
            class="text-center py-8 text-slate-500">
          ✅ 本週無缺額賽事
        </td>
      </tr>
    `;

    return;
  }

  tbody.innerHTML = games.map(g => {

    const judgeBadges =
      (g.missingJudge || [])
        .map(x => `
          <span class="badge badge-red">
            ${x}
          </span>
        `)
        .join('');

    const recordBadges =
      (g.missingRecord || [])
        .map(x => `
          <span class="badge badge-orange">
            ${x}
          </span>
        `)
        .join('');

    return `

      <tr class="hover:bg-slate-50">

        <td class="py-3 px-4">

          <div class="font-bold">
            ${g.tournament || ''}
          </div>

          <div class="text-xs text-slate-500">
            ${g.game_code || ''}
          </div>

        </td>

        <td class="py-3 px-4">

          <div class="font-semibold">
            ${g.date}
          </div>

          <div class="text-xs text-slate-500">
            ${g.time}
          </div>

        </td>

        <td class="py-3 px-4">

          ${g.away_team || ''}
          VS
          ${g.home_team || ''}

        </td>

        <td class="py-3 px-4">

          ${g.field || ''}

        </td>

        <td class="py-3 px-4">

          ${judgeBadges}
          ${recordBadges}

        </td>

        <td class="py-3 px-4 text-right">

          <button
            class="btn-action"
            onclick="openAssignment('${g.game_id}')">

            指派

          </button>

        </td>

      </tr>

    `;

  }).join('');

}

/*********************************************************
 * Sidebar
 *********************************************************/
function toggleSidebar(){

  document
    .getElementById('sidebar')
    ?.classList
    .toggle('-translate-x-full');

  document
    .getElementById('sidebar-overlay')
    ?.classList
    .toggle('hidden');

}

/*********************************************************
 * 快速指派
 *********************************************************/
function openAssignment(gameId){

  console.log(
    'assign game',
    gameId
  );

  showToast(
    `開啟賽事 ${gameId}`
  );

}

/*********************************************************
 * Modal
 *********************************************************/
function showModal(title){

  setText(
    'modal-title',
    title
  );

  document
    .getElementById('admin-modal')
    ?.classList
    .remove('hidden');

}

function closeModal(){

  document
    .getElementById('admin-modal')
    ?.classList
    .add('hidden');

}

/*********************************************************
 * Toast
 *********************************************************/
function showToast(msg){

  const toast =
    document.getElementById(
      'toast'
    );

  if(!toast){
    return;
  }

  setText(
    'toast-msg',
    msg
  );

  toast.classList.remove(
    'translate-y-20',
    'opacity-0'
  );

  setTimeout(() => {

    toast.classList.add(
      'translate-y-20',
      'opacity-0'
    );

  },3000);

}

/*********************************************************
 * 共用工具
 *********************************************************/
function setText(id,value){

  const el =
    document.getElementById(id);

  if(el){
    el.textContent = value;
  }

}
