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
 * 9. 開啟快速指派
 *********************************************************/
/*********************************************************
 * 共用工具
 *********************************************************/

/* 全域變數定義 */
let quickAssignContext = null;

/* 格式化時間 */
function formatGameTime(time){

  if (!time) return '';

  if (
    typeof time === 'string' &&
    time.includes('T')
  ){

    const d = new Date(time);

    return d.toLocaleTimeString(
      'zh-TW',
      {
        hour:'2-digit',
        minute:'2-digit',
        hour12:false
      }
    );

  }
  return String(time).substring(0,5);
}

/* 管理頁登入驗證 */

function guardAdminPage(){

  const session = JSON.parse(localStorage.getItem('session_user') || '{}');
  
  if (!session.user_id){

    alert('尚未登入');

    location.replace(
      'login.html'
    );

    return false;

  }

  return true;

}

/*********************************************************
 * 初始化
 *********************************************************/
document.addEventListener('DOMContentLoaded', () => {

  guardAdminPage();

  const session =
    JSON.parse(
      localStorage.getItem('session_user') || '{}'
    );

  const userName =
    document.getElementById('sidebarUserName');

  const userRole =
    document.getElementById('sidebarUserRole');

  const avatar =
    document.getElementById('sidebarAvatar');

  const displayName =
    session.name ||
    session.user_name ||
    '未登入';

  if(userName){
    userName.textContent = displayName;
  }

  if(userRole){
    userRole.textContent =
      session.role || '-';
  }

  if(avatar){
    avatar.textContent =
      displayName.trim().charAt(0);
  }

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

      const session =
        typeof getSession === 'function'
          ? getSession()
          : null;

      document.body.classList.remove(
        'role-admin',
        'role-judge',
        'role-record'
      );

      if (
        session &&
        session.role
      ){

        const roles =
          session.role
            .split(',')
            .map(r => r.trim());

        if (
          roles.includes('admin')
        ){
          document.body.classList.add(
            'role-admin'
          );
        }

        if (
          roles.includes('judge') ||
          roles.includes('chief_judge')
        ){
          document.body.classList.add(
            'role-judge'
          );
        }

        if (
          roles.includes('record') ||
          roles.includes('record_chief')
        ){
          document.body.classList.add(
            'role-record'
          );
        }

      }

      if(window.lucide){
        lucide.createIcons();
      }

    })
    .catch(err => {
      console.error(
        'Header 載入失敗',
        err
      );
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
    'Dashboard Data',
    data
  );

  if(
    !data ||
    data.result !== 'ok'
  ){

    console.error(
      'Dashboard API Error',
      data
    );

    showToast(
      'Dashboard 載入失敗'
    );

    return;

  }

  // ✅ 保存 Dashboard 資料
  window._dashboardData = data;

  // ✅ Alert
  renderAlerts(data);

  // ✅ 賽事 KPI
  renderMatchStats(data);

  // ✅ 人員 KPI
  renderPeopleStats(data);

  // ✅ 缺額賽事
  renderVacancyGames(data);

  // ✅ Sidebar
  renderSidebar(data);

  // ✅ Lucide Icons 重新渲染
  if(window.lucide){
    lucide.createIcons();
  }

}


/*********************************************************
 * Alert 區塊
 *********************************************************/
function renderAlerts(data){

  const alerts =
    data.alerts || {};

  const judgeCount =
    alerts.judgeShortageGames || 0;

  const recordCount =
    alerts.recordShortageGames || 0;

  const pendingCount =
    alerts.noSignupCount || 0;

  setText(
    'alertJudgeCount',
    judgeCount
  );

  setText(
    'alertRecordCount',
    recordCount
  );

  setText(
    'alertPendingCount',
    pendingCount
  );

  const tag =
    document.getElementById(
      'recordStatusTag'
    );

  const text =
    document.getElementById(
      'recordStatusText'
    );

  const badge =
    document.getElementById(
      'recordStatusBadge'
    );

  if(recordCount === 0){
  
    tag.textContent =
      '紀錄補齊';
  
    text.textContent =
      '（本週皆已完成派遣）';
  
    badge.innerHTML =
      '<i data-lucide="shield-check" class="w-3.5 h-3.5"></i>正常';
  
  }else{
  
    tag.textContent =
      '需補紀錄';
  
    text.textContent =
      `（尚有 ${recordCount} 場）`;
  
    badge.innerHTML =
      '<i data-lucide="alert-triangle" class="w-3.5 h-3.5"></i>缺額';
  
  }

}

/*********************************************************
 * Sidebar
 *********************************************************/
function renderSidebar(data){

  const alerts =
    data.alerts || {};

  const people =
    data.peopleStats || {};

  setText(
    'sidebarJudgeShortage',
    alerts.judgeShortageGames > 0
      ? `${alerts.judgeShortageGames} 缺額`
      : ''
  );

  setText(
    'sidebarRecordShortage',
    alerts.recordShortageGames > 0
      ? `${alerts.recordShortageGames} 缺額`
      : '額滿'
  );

  setText(
    'sidebarnoSignupCount',
    alerts.noSignupCount > 0
      ? `${alerts.noSignupCount} 待簽`
      : ''
  );

  setText(
    'sidebarUserCount',
    `${people.totalUsers || 0}帳號`
  );

}

/*********************************************************
 * 賽事 KPI
 *********************************************************/
function renderMatchStats(data){

  const stats =
    data.matchStats || {};

  const total =
    Number(stats.totalGames || 0);

  const completed =
    Number(stats.completedGames || 0);

  const pending =
    Number(stats.pendingGames || 0);

  const week =
    Number(stats.weekGames || 0);

  setText('totalGames', total);
  setText('completedGames', completed);
  setText('pendingGames', pending);
  setText('weekGames', week);

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
    document.getElementById('completedBar');

  const pendingBar =
    document.getElementById('pendingBar');

  const weekBar =
    document.getElementById('weekBar');

  if(completedBar){
    completedBar.style.width =
      `${progress}%`;
  }

  if(pendingBar){
    pendingBar.style.width =
      `${100 - progress}%`;
  }

  if(weekBar){

    const weekPercent =
      total
        ? Math.round(
            (week / total) * 100
          )
        : 0;

    weekBar.style.width =
      `${weekPercent}%`;
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

  const games =
    data.vacancyGames || [];

  if(window.innerWidth < 768){

    renderVacancyCards(games);

  }else{

    renderVacancyTable(games);

  }

}

/*********************************************************
 * 缺額賽事表格　—　桌機版
 *********************************************************/
function renderVacancyTable(games){

  const tbody =
    document.getElementById(
      'vacancy-table-body'
    );

  const footer =
    document.getElementById(
      'vacancy-table-footer'
    );

  const countBox =
    document.getElementById(
      'vacancyGameCount'
    );

  if(!tbody){
    return;
  }

  if(!games.length){

    tbody.innerHTML = `
      <tr>
        <td colspan="6"
            class="text-center py-10 text-slate-400">
          ✅ 本週無缺額賽事
        </td>
      </tr>
    `;

    if(footer){
      footer.textContent =
        '本週無缺額賽事';
    }

    if(countBox){
      countBox.textContent =
        '共 0 場需補派';
    }

    return;
  }

  if(countBox){
    countBox.textContent =
      `共 ${games.length} 場待完成派遣`;
  }

  if(footer){
    footer.textContent =
      `顯示 ${games.length} 筆缺額賽事`;
  }

  tbody.innerHTML = games.map(g => {

  const judgeBadges =
    (g.missingJudge || [])
      .map(x => {
  
        const count = x.signupCount || 0;
  
        let colorClass =
          'border-rose-200 bg-rose-100 text-rose-700';
  
        if (count > 0 && count < 3) {
  
          colorClass =
            'border-amber-200 bg-amber-100 text-amber-700';
  
        } else if (count >= 3) {
  
          colorClass =
            'border-emerald-200 bg-emerald-100 text-emerald-700';
  
        }
  
        return `
          <button
            onclick="openJudgeAssignment('${g.game_id}','${x.code}')"
            class="inline-flex items-center rounded-lg border ${colorClass} hover:opacity-80 px-2 py-1 text-[11px] font-bold mr-1 mb-1 transition">
  
            ${x.name}(${count})
  
          </button>
        `;
  
      })
      .join('');

  const recordBadges =
    (g.missingRecord || [])
      .map(x => {
  
        const count = x.signupCount || 0;
  
        let colorClass =
          'border-rose-200 bg-rose-100 text-rose-700';
  
        if (count > 0 && count < 3) {
  
          colorClass =
            'border-amber-200 bg-amber-100 text-amber-700';
  
        } else if (count >= 3) {
  
          colorClass =
            'border-emerald-200 bg-emerald-100 text-emerald-700';
  
        }
  
        return `
          <button
            onclick="openRecordAssignment('${g.game_id}','${x.code}')"
            class="inline-flex items-center rounded-lg border ${colorClass} hover:opacity-80 px-2 py-1 text-[11px] font-bold mr-1 mb-1 transition">
  
            ${x.name}(${count})
  
          </button>
        `;
  
      })
      .join('');


    return `

      <tr class="hover:bg-slate-50 transition">

        <!-- 聯賽 -->
        <td class="py-3 px-4">

          <div class="font-bold text-slate-900">
            ${g.tournament || ''}
          </div>

          <div class="text-xs text-slate-500">
            ${g.game_code || ''}
          </div>

        </td>

        <!-- 時間 -->
        <td class="py-3 px-4">

          <div class="font-semibold text-slate-900">
            ${g.date || ''}
          </div>

          <div class="text-xs text-slate-500">
            ${g.time || ''}
          </div>

        </td>

        <!-- 對戰 -->
        <td class="py-3 px-4">

          <div class="font-bold text-slate-900">
            ${g.away_team || ''}
            <span class="mx-1 text-slate-400">
              VS
            </span>
            ${g.home_team || ''}
          </div>

        </td>

        <!-- 球場 -->
        <td class="py-3 px-4 text-slate-600">

          ${g.field || ''}

        </td>

        <!-- 缺額 -->
        <td class="py-3 px-4">

          <div class="flex flex-wrap">

            ${judgeBadges}

            ${recordBadges}

          </div>

        </td>

        <!-- 操作 -->
        <td class="py-3 px-4 text-right">

        </td>

      </tr>

    `;

  }).join('');

}

/*********************************************************
 * 缺額賽事表格－手機版
 *********************************************************/
function renderVacancyCards(games){

  const container =
    document.getElementById(
      'vacancy-card-container'
    );

  const footer =
    document.getElementById(
      'vacancy-table-footer'
    );

  const countBox =
    document.getElementById(
      'vacancyGameCount'
    );

  if(!container){
    return;
  }

  if(!games.length){

    container.innerHTML = `
      <div class="text-center py-10 text-slate-400">
        ✅ 本週無缺額賽事
      </div>
    `;

    if(footer){
      footer.textContent =
        '本週無缺額賽事';
    }

    if(countBox){
      countBox.textContent =
        '共 0 場需補派';
    }

    return;
  }

  if(footer){
    footer.textContent =
      `顯示 ${games.length} 筆缺額賽事`;
  }

  if(countBox){
    countBox.textContent =
      `共 ${games.length} 場待完成派遣`;
  }

  container.innerHTML = games.map(g => {

    const judgeBadges =
      (g.missingJudge || [])
        .map(x => `
          <button
            onclick="openJudgeAssignment('${g.game_id}','${x.code}')"
            class="inline-flex items-center rounded-lg border border-rose-200 bg-rose-100 hover:bg-rose-200 px-2 py-1 text-[11px] font-bold text-rose-700">
    
            ${x.name}
    
          </button>
        `).join('');
    
    const recordBadges =
      (g.missingRecord || [])
        .map(x => `
          <button
            onclick="openRecordAssignment('${g.game_id}','${x.code}')"
            class="inline-flex items-center rounded-lg border border-amber-200 bg-amber-100 hover:bg-amber-200 px-2 py-1 text-[11px] font-bold text-amber-700">
    
            ${x.name}
    
          </button>
        `).join('');

    return `
    
      <div class="border-b border-slate-200 p-4">
    
        <div class="flex items-center justify-between">
    
          <div class="font-bold text-brand-700">
            ${g.tournament || ''}
          </div>
    
          <div class="text-xs text-slate-500">
            ${g.game_code || ''}
          </div>
    
        </div>
    
        <div class="mt-3 flex items-center justify-between">
    
          <div class="font-semibold text-slate-900">
            ${g.date || ''} ${g.time || ''}
          </div>
    
          <div class="font-bold text-slate-900 text-right">
            ${g.away_team || ''}
            <span class="text-slate-400 px-1">
              VS
            </span>
            ${g.home_team || ''}
          </div>
    
        </div>
    
        <div class="mt-1 text-sm text-slate-500">
          📍 ${g.field || ''}
        </div>
    
        <div class="mt-3 flex flex-wrap gap-1">
          ${judgeBadges}
          ${recordBadges}
        </div>
    
        <button
          class="mt-3 w-full bg-brand-600 hover:bg-brand-700 text-white py-2 rounded-lg text-sm font-bold"
          onclick="openAssignment('${g.game_id}')">
    
          快速指派
    
        </button>
    
      </div>
    
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
 * Dashboard 快速指派
 *********************************************************/
function openAssignment(gameId){

  const games =
    window._dashboardData?.vacancyGames || [];

  const game =
    games.find(
      g => String(g.game_id) === String(gameId)
    );

  if(!game){

    showToast('找不到賽事資料');

    return;

  }

  document.getElementById(
    'modal-title'
  ).textContent =
    `快速指派｜${game.game_code}`;

  const judgeRoles =
    game.missingJudge || [];

  const recordRoles =
    game.missingRecord || [];

  document.getElementById(
    'modal-content'
  ).innerHTML = `

    <div class="space-y-4">

      <div>

        <div class="text-base font-bold text-slate-900">
          ${game.away_team}
          VS
          ${game.home_team}
        </div>

        <div class="text-sm text-slate-500">
          ${game.date}
          ${game.time}
        </div>

        <div class="text-sm text-slate-500">
          📍 ${game.field}
        </div>

      </div>

      <div>

        <div class="font-bold mb-2">
          缺額職務
        </div>

        <div class="flex flex-wrap gap-2">

          ${judgeRoles.map(role => `
            <button
              class="assign-role-btn bg-rose-100 text-rose-700 border border-rose-200 rounded-lg px-3 py-2 text-sm font-bold"
              onclick="openJudgeAssignment('${gameId}','${role.code}')">
          
              ${role.name}
          
            </button>
          `).join('')}

          ${recordRoles.map(role => `
            <button
              class="assign-role-btn bg-amber-100 text-amber-700 border border-amber-200 rounded-lg px-3 py-2 text-sm font-bold"
              onclick="openRecordAssignment('${gameId}','${role.code}')">
          
              ${role.name}
          
            </button>
          `).join('')}

        </div>

      </div>

      <div class="text-xs text-slate-500">

        點選缺額職務後，
        將自動跳往對應排班頁處理。

      </div>

    </div>

  `;

  document
    .getElementById('admin-modal')
    .classList
    .remove('hidden');

}

/*********************************************************
 * 前往排班頁
 *********************************************************/
function openJudgePage(gameId){

  closeModal();

  showToast(
    `請至排班頁處理 ${gameId}`
  );

  location.href =
    'judge_dashboard_admin.html';

}

/*********************************************************
 * 裁判指派
 *********************************************************/
window.openJudgeAssignment = function(
  gameId,
  role
){

  sessionStorage.setItem(
    'returnToDashboard',
    'Y'
  );

  location.href =
    `judge_dashboard_admin.html?gameId=${gameId}&role=${encodeURIComponent(role)}`;

};


/*********************************************************
 * 紀錄指派
 *********************************************************/
window.openRecordAssignment = function(
  gameId,
  role
){

  location.href =
    `record_dashboard_admin.html?gameId=${gameId}&role=${encodeURIComponent(role)}`;

};

/*********************************************************
 * 複製場次代號
 *********************************************************/
function copyGameCode(code){

  navigator.clipboard
    .writeText(code)
    .then(() => {

      showToast(
        `已複製 ${code}`
      );

    });

}

/*********************************************************
 * 裁判 Dashboard 接 URL
 *********************************************************/
function getUrlParams(){

  const params =
    new URLSearchParams(
      location.search
    );

  return {
    gameId : params.get('gameId'),
    role   : params.get('role')
  };

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

/*********************************************************
 * RWD 自動切換
 *********************************************************/
window.addEventListener('resize', () => {

  if(window._dashboardData){

    renderVacancyGames(
      window._dashboardData
    );

  }

});

/*********************************************************
 * ?????????
 *********************************************************/
function focusGameFromUrl(){

  if(autoAssignOpened){
    return;
  }

  const params =
    new URLSearchParams(
      location.search
    );

  const gameId =
    params.get('gameId');

  const role =
    params.get('role');

  if(!gameId){
    return;
  }

  autoAssignOpened = true;

  setTimeout(()=>{

    const card =
      document.getElementById(
        `game-${gameId}`
      );

    if(card){

      card.scrollIntoView({
        behavior:'smooth',
        block:'center'
      });

      card.classList.add(
        'ring-4',
        'ring-amber-400'
      );

      setTimeout(()=>{
        card.classList.remove(
          'ring-4',
          'ring-amber-400'
        );
      },3000);

    }

    if(role){

      openAssignJudge(
        gameId,
        role
      );

    }

    history.replaceState(
      {},
      '',
      location.pathname
    );

  },300);

}

// 首頁快速指派裁判
function openQuickJudgeAssign(
  gameId,
  role
){

  quickAssignContext = {
    gameId,
    role
  };

  document
    .getElementById(
      'quickAssignTitle'
    )
    .textContent =
      `指派 ${role}`;

  callApi({
    action : 'getAvailableJudges',
    game_id : gameId,
    role : role

  }, res => {

    const list =
      document.getElementById(
        'quickAssignList'
      );

    list.innerHTML =
      (res.data || [])
        .map(j => `

          <button
            onclick="quickAssignJudge('${j.user_id}')"
            class="w-full text-left border rounded-lg p-3 mb-2 hover:bg-slate-50">

            <div class="font-semibold">
              ${j.name}
            </div>

          </button>

        `)
        .join('');

    document
      .getElementById(
        'quickAssignModal'
      )
      .classList
      .remove('hidden');

  });

}

function quickAssignJudge(
  judgeId
){

  if(!quickAssignContext){
    return;
  }

  callApi({

    action :
      'assignJudgeToPosition_admin',

    game_id :
      quickAssignContext.gameId,

    role :
      quickAssignContext.role,

    judge_id :
      judgeId

  }, res => {

    if(
      !res ||
      res.result !== 'ok'
    ){
      alert(
        res?.message ||
        '指派失敗'
      );
      return;
    }

    document
      .getElementById(
        'quickAssignModal'
      )
      .classList
      .add('hidden');

    loadDashboard();

  });

}

function closeQuickAssignModal(){

  document
    .getElementById(
      'quickAssignModal'
    )
    .classList
    .add('hidden');

}
