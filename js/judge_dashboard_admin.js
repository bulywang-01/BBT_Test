/* =========================
 * 全域資料
 * ========================= */
let allGames = [];
let allJudges = [];
let currentDateFilter = 'ALL';
let currentMonthFilter = 'ALL';  // 篩選月份

/* =========================
 * 站位中文對照
 * ========================= */
const ROLE_LABEL = {
  PU: '主審',
  U1: '一壘',
  U2: '二壘',
  U3: '三壘'
};

/* =========================
 * 共用工具
 * ========================= */
// ✅ 目前登入使用者（裁判長 / admin）
const session = JSON.parse(localStorage.getItem('session_user') || '{}');
const CURRENT_USER_ID = session.user_id || '';

function setText(id, value){

  const el =
    document.getElementById(id);

  if(el){
    el.textContent = value;
  }
}

function formatDate(d) {
  const x = new Date(d);
  return `${x.getFullYear()}/${x.getMonth() + 1}/${x.getDate()}`;
}

function formatTime(t) {
  const d = new Date(t);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// 日期不呈現年份
function formatShortDate(date){
  const d = new Date(date);
  return `${d.getMonth()+1}/${d.getDate()}`;
}

// 篩選月份
function changeMonthFilter(month){
  currentMonthFilter = month;
  currentDateFilter = 'ALL';
  renderDateTabs();
  render();
}


// 日期切換
function changeDateFilter(date){
  currentDateFilter = date;
  renderDateTabs();
  render();
}


function isPositionFilled(pos){
  return !!(
    pos?.assigned ||
    (
      Array.isArray(pos?.preferred) &&
      pos.preferred.length > 0
    )
  );
}

/* =========================
 * 日期燈號
 * RED    = 完全沒人
 * YELLOW = 有缺額
 * GREEN  = 全部已有報名/指派
 * ========================= */
function getDateStatus(date){

  const games =
    allGames.filter(g =>
  
      formatDate(g.date) === date &&
  
      Number(g.umpire_count ?? 0) > 0
  
    );

  let hasRed = false;
  let hasYellow = false;

  games.forEach(game => {

    const activeRoles = {
      0:[],
      1:['PU'],
      2:['PU','U1'],
      3:['PU','U1','U3'],
      4:['PU','U1','U2','U3']
    }[
      Number(game.umpire_count ?? 0)
    ] || [];

    if(!activeRoles.length){
      return;
    }

    let filledCount = 0;

    activeRoles.forEach(role => {
    
      if(
        isPositionFilled(
          game.positions?.[role]
        )
      ){
        filledCount++;
      }
    
    });


    if(filledCount === 0){

      hasRed = true;

    }else if(
      filledCount < activeRoles.length
    ){

      hasYellow = true;

    }

  });

  if(hasRed){
    return 'RED';
  }

  if(hasYellow){
    return 'YELLOW';
  }

  return 'GREEN';

}

/* =========================
 * 全部日期
* ========================= */
function renderDateTabs(){

  const tabs =
    document.getElementById(
      'dateTabs'
    );

  if(!tabs){
    return;
  }

  let dates = [
    ...new Set(
  
      allGames
        .filter(g => {
  
          if(
            currentMonthFilter === 'ALL'
          ){
            return true;
          }
  
          return (
            new Date(g.date)
              .getMonth() + 1
          ) === Number(
            currentMonthFilter
          );
  
        })
        .map(g =>
          formatDate(g.date)
        )
  
    )
  ];

  dates.sort((a,b)=>{

    const priority = {
      RED:0,
      YELLOW:1,
      GREEN:2
    };

    const statusA =
      getDateStatus(a);

    const statusB =
      getDateStatus(b);

    if(
      priority[statusA] !==
      priority[statusB]
    ){

      return (
        priority[statusA] -
        priority[statusB]
      );

    }

    return (
      new Date(a.replace(/\//g,'-')) -
      new Date(b.replace(/\//g,'-'))
    );

  });

  tabs.innerHTML = `

    <button
      onclick="changeDateFilter('ALL')"
      class="
        px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap
        ${
          currentDateFilter === 'ALL'
          ? 'bg-slate-900 text-white'
          : 'bg-slate-100 text-slate-600'
        }">

      全部日期

    </button>

    ${dates.map(date => {

      const status =
        getDateStatus(date);

      let buttonClass =
        'bg-emerald-500 text-white';

      if(status === 'RED'){

        buttonClass =
          'bg-rose-500 text-white';

      }else
      if(status === 'YELLOW'){

        buttonClass =
          'bg-amber-400 text-slate-900';

      }

      if(
        currentDateFilter === date
      ){

        buttonClass +=
          ' ring-2 ring-slate-900';

      }

      return `

        <button
          onclick="changeDateFilter('${date}')"
          class="
            px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap
            ${buttonClass}
          ">

          ${formatShortDate(date)}

        </button>

      `;

    }).join('')}

  `;

}

/* =========================
 * 載入資料
 * ========================= */
function loadGames() {

  console.log(
    'loadGames start'
  );

  callApi(
    {
      action:'getGamesWithAssignments_admin'
    },
    res => {

      console.log(
        'judge dashboard data =',
        res
      );

      if(
        !res ||
        res.result !== 'ok'
      ){

        console.error(
          'API 回傳異常',
          res
        );

        const box =
          document.getElementById(
            'content'
          );

        if(box){

          box.innerHTML = `
            <div class="bg-white rounded-2xl border border-rose-200 p-10 text-center text-rose-600 font-bold">
              裁判班表資料載入失敗
            </div>
          `;

        }

        return;
      }

      allGames =
        res.games || [];

      allJudges =
        res.judges || [];

      render();
      renderKPI();
      renderMonthTabs();
      renderDateTabs();
    }
  );

}

/* =========================
 * 分組：日期 → category（大聯盟組/小聯盟組）→ 時間排序
 * ========================= */
function groupGames(games) {
  const map = {};

  games.forEach(g => {
    const dateKey = formatDate(g.date);
    const categoryKey = g.category; // ✅ 正確欄位

    if (!map[dateKey]) map[dateKey] = {};
    if (!map[dateKey][categoryKey]) map[dateKey][categoryKey] = [];

    map[dateKey][categoryKey].push(g);
  });

  // 每個 category 內依時間排序
  Object.values(map).forEach(categoryMap => {
    Object.values(categoryMap).forEach(list => {
      list.sort((a, b) => new Date(a.time) - new Date(b.time));
    });
  });

  return map;
}

/*********************************************************
 * Render 主畫面 V2
 *********************************************************/
function render(){

  const box =
    document.getElementById('content');

  if(!box){
    return;
  }

  if(!allGames.length){

    box.innerHTML = `
      <div class="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400">
        目前沒有賽事資料
      </div>
    `;

    return;

  }

  const filteredGames = allGames.filter(g=>{
  
    const gameMonth =
      new Date(g.date).getMonth()+1;
  
    const monthMatch =
      currentMonthFilter === 'ALL'
        ? true
        : gameMonth === Number(currentMonthFilter);
  
    const dateMatch =
      currentDateFilter === 'ALL'
        ? true
        : formatDate(g.date) === currentDateFilter;
  
    return (
      monthMatch &&
      dateMatch &&
      Number(g.umpire_count ?? 0) > 0
    );
  
  });
  
  const grouped =
    groupGames(filteredGames);

  const dates =
    Object.keys(grouped).sort(
      (a,b)=>
        new Date(a.replace(/\//g,'-')) -
        new Date(b.replace(/\//g,'-'))
    );

  box.innerHTML = dates.map(date => {

    const categoryMap =
      grouped[date];

    return `

      <div class="space-y-4">

        <div class="flex items-center space-x-2 border-b-2 border-slate-200 pb-2">

          <i data-lucide="calendar"
             class="w-5 h-5 text-brand-600"></i>

          <h3 class="text-base font-black text-slate-900">
            ${formatShortDate(date)}
          </h3>

        </div>

        ${Object.keys(categoryMap).map(category => `

          <div class="mb-2">

            <span
              class="bg-slate-200 text-slate-700 text-xs px-2.5 py-0.5 rounded-full font-bold">

              ${category}

            </span>

          </div>

          ${categoryMap[category]
            .map(game => renderGameCard(game))
            .join('')}

        `).join('')}

      </div>

    `;

  }).join('');

  if(window.lucide){
    lucide.createIcons();
  }

}

/*********************************************************
 * 賽事卡片
 *********************************************************/
function renderGameCard(game){

  const requiredRoles = {
    0:[],
    1:['PU'],
    2:['PU','U1'],
    3:['PU','U1','U3'],
    4:['PU','U1','U2','U3']
  };

  const activeRoles =
    requiredRoles[
      Number(game.umpire_count ?? 0)
    ] || [];

  const missingCount =
    activeRoles.filter(role => {
  
      const pos =
        game.positions?.[role];
  
      return !isPositionFilled(pos);
  
    }).length;

  return `
    <div
      id="game-${game.game_id}"
      class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition mb-4">

      <div class="bg-slate-50 px-4 py-3 border-b border-slate-100">

        <div class="flex items-center justify-between gap-2 flex-wrap">
          <div class="flex items-center gap-2">
            <span class="bg-brand-600 text-white text-xs font-black px-2.5 py-1 rounded-lg">
              ${formatTime(game.time)}
            </span>
  
            <span class="font-black text-slate-900 text-base">
              ${game.away_team}
              <span class="text-slate-400 mx-1">VS</span>
              ${game.home_team}
            </span>
          </div>

        </div>

        <div class="mt-1 flex flex-wrap items-center justify-between gap-2">

          <div class="text-xs text-slate-500">
            📍 ${game.field || '-'}
          </div>

          ${
            activeRoles.length === 0

            ? `
              <span class="bg-slate-100 text-slate-600 px-2 py-1 rounded-lg text-xs font-bold">
                不需裁判
              </span>
            `

            : missingCount > 0

            ? `
              <span class="bg-amber-100 text-amber-800 px-2 py-1 rounded-lg border border-amber-200 text-xs font-bold">
                尚缺 ${missingCount} 位裁判
              </span>
            `

            : `
              <span class="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-lg border border-emerald-200 text-xs font-bold">
                已滿編
              </span>
            `
          }

        </div>

      </div>

      ${
        activeRoles.length > 0

        ? `

          <div class="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${Math.min(activeRoles.length,4)} gap-3">

            ${activeRoles
              .map(role =>
                renderPosCell(game, role)
              )
              .join('')}

          </div>

        `

        : ''

      }

    </div>
  `;
}

/*********************************************************
 * 裁判站位卡
 *********************************************************/
function renderPosCell(game, role){

  const pos = game.positions[role];

  const roleMap = {
    PU:'主審',
    U1:'一壘審',
    U2:'二壘審',
    U3:'三壘審'
  };

  const requiredRoles = {
    0:[],
    1:['PU'],
    2:['PU','U1'],
    3:['PU','U1','U3'],
    4:['PU','U1','U2','U3']
  };
  
  const activeRoles =
    requiredRoles[
      Number(game.umpire_count ?? 0)
    ] || [];

  const disabled =
    !activeRoles.includes(role);

  /* 不配置 */

  if(disabled){

    return `
      <div class="bg-slate-50 border border-slate-200 rounded-xl p-3.5 opacity-60">

        <div class="flex items-center justify-between">

          <span class="text-xs font-bold text-slate-500">
            ${roleMap[role]}
          </span>

          <span class="text-[10px] text-slate-400 bg-slate-200 px-2 py-0.5 rounded">
            不指派
          </span>

        </div>

        <div class="text-center py-4 text-xs font-bold text-slate-400">
          本場不配置
        </div>

      </div>
    `;
  }

  /* 已指派 */

  if(pos.assigned){

    return `
      <div class="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col justify-between space-y-3">

        <div class="flex items-center justify-between">

          <span class="text-xs font-black text-slate-700">
            ${roleMap[role]}
          </span>

          <span class="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
            已確認
          </span>

        </div>

        <div>

          <div class="font-black text-base text-slate-900 mb-2">
            ${pos.assigned.name || '未命名'}
          </div>

          <div class="flex gap-1">

            <button
              onclick="openAssignJudge('${game.game_id}','${role}')"
              class="flex-1 bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold py-1.5 rounded-lg">

              更換

            </button>

            <button
              onclick="cancelJudgeAssignment('${game.game_id}','${role}')"
              class="flex-1 bg-rose-500 hover:bg-rose-600 text-white text-[11px] font-bold py-1.5 rounded-lg">

              刪除

            </button>

          </div>

        </div>

      </div>
    `;
  }

  /* 已有人報名但尚未指派 */

  if(
    pos.preferred &&
    pos.preferred.length > 0
  ){

    return `
      <div class="bg-amber-50 border-2 border-dashed border-amber-300 rounded-xl p-3.5 flex flex-col justify-between space-y-3">

        <div class="flex items-center justify-between">

          <span class="text-xs font-black text-amber-800">
            ${roleMap[role]}
          </span>

          <span class="text-[11px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded">
            ${pos.preferred.length} 人報名
          </span>

        </div>

        <div class="space-y-2">

          ${pos.preferred.map((j,index) => `

            <div class="flex items-center justify-between text-xs">

              <span class="font-medium text-slate-700">
                ${index + 1}. ${j.name}
              </span>

              <button
                onclick="
                  cancelJudgeSignup(
                    '${game.game_id}',
                    '${role}',
                    '${j.id}'
                  )
                "
                class="bg-rose-500 hover:bg-rose-600 text-white text-[10px] px-2 py-0.5 rounded">

                取消

              </button>

            </div>

          `).join('')}

        </div>

        <button
          onclick="openAssignJudge('${game.game_id}','${role}')"
          class="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs py-2 rounded-lg">

          指派${roleMap[role]}

        </button>

      </div>
    `;
  }

  /* 尚未指派 */

  return `
    <div class="bg-amber-50/50 border-2 border-dashed border-amber-300 rounded-xl p-3.5 flex flex-col justify-between space-y-3">

      <div class="flex items-center justify-between">

        <span class="text-xs font-black text-amber-800">
          ${roleMap[role]}
        </span>

        <span class="text-[11px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded">
          尚未指派
        </span>

      </div>

      <div class="text-center py-3">

        <p class="text-xs text-slate-400 font-medium mb-2">
          尚未選擇裁判
        </p>

        <button
          onclick="openAssignJudge('${game.game_id}','${role}')"
          class="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs py-2 rounded-lg">

          指派${roleMap[role]}

        </button>

      </div>

    </div>
  `;
}

/* =========================
 * 啟動
 * ========================= */
document.addEventListener(
  'DOMContentLoaded',
  () => {

    console.log(
      'judge dashboard start'
    );

    loadGames();

  }
);


let currentAssignContext = null;

/**
 * 開啟指派裁判 modal
 * @param {string|number} gameId
 * @param {string} role  PU / U1 / U2 / U3
 */

window.openAssignJudge = function (gameId, role) {
  currentAssignContext = { gameId, role };

  const modal = document.getElementById('judgeModal');
  const list = document.getElementById('judgeList');
  const title = document.getElementById('judgeModalTitle');

  title.textContent = `指派 ${ROLE_LABEL[role]}`;
  list.innerHTML = '載入中…';

  modal.classList.remove('hidden');

  callApi({
    action: 'getAssignableJudges_admin',
    game_id: gameId,
    user_id: CURRENT_USER_ID
  }, res => {

    list.innerHTML = '';

    // ❌ 防呆
    if (!res || res.result !== 'ok' || !Array.isArray(res.judges)) {
      list.innerHTML = `<div class="empty">目前無可指派裁判</div>`;
      return;
    }

    // ✅ 找到該場比賽
    const game = allGames.find(g => String(g.game_id) === String(gameId));
    
    // ✅ 本場「已佔位的人（裁判 + 報名）」全部抓出來
    const occupiedIds = new Set();
    
    if (game && game.positions) {
    
      Object.values(game.positions).forEach(p => {
    
        // ✅ 已指派
        if (p.assigned && p.assigned.id) {
          occupiedIds.add(String(p.assigned.id));
        }
    
        // ✅ ✅ ✅ 加這段（關鍵！）→ 報名的人也不能再當別的位置
        if (Array.isArray(p.preferred)) {
          p.preferred.forEach(u => {
            if (u.id) {
              occupiedIds.add(String(u.id));
            }
          });
        }
    
      });
    }


    // ✅ 排序（證照 > 姓名）
    const levelPriority = {
      A: 3,
      B: 2,
      C: 1
    };
    
    const sortedJudges = res.judges.sort((a, b) => {
    
      // ✅ level（你 Users 裡是 level 欄位）
      const levelA = (a.level || '').toUpperCase();
      const levelB = (b.level || '').toUpperCase();
    
      const scoreA = levelPriority[levelA] || 0;
      const scoreB = levelPriority[levelB] || 0;
    
      // ✅ 先比證照（高 → 低）
      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }
    
      // ✅ 再比姓名第一個字
      const nameA = (a.name || '').charAt(0);
      const nameB = (b.name || '').charAt(0);
    
      return nameA.localeCompare(nameB, 'zh-Hant');
    });

    // ✅ 嚴格過濾：只要已在任何裁判站位 → 不顯示
    // res.judges.forEach(j => {
    
    sortedJudges.forEach(j => {
      const uid = String(j.user_id);

      if (occupiedIds.has(uid)) return;

      const card = document.createElement('div');
      card.className = 'judge-card';
      card.textContent = j.name;
      card.onclick = () => assignJudge(j);

      list.appendChild(card);
    });

    if (!list.children.length) {
      list.innerHTML = `<div class="empty">目前無可指派裁判</div>`;
    }
  });
};

/* 改成掛在 window */
window.closeJudgeModal = function () {
  const modal = document.getElementById('judgeModal');
  const list = document.getElementById('judgeList');

  modal.classList.add('hidden');
  list.innerHTML = '';
  currentAssignContext = null;
};

window.handleModalBackdrop = function (e) {
  if (e.target.id === 'judgeModal') {
    closeJudgeModal();
  }
};

function assignJudge(judge) {
  if (!currentAssignContext) return;

  const modal = document.getElementById('judgeModal');
  const loading = document.getElementById('judgeLoading');

  // ✅ 立刻給使用者回饋
  showAssignMessage('⏳ 指派中，請稍候…');

  // ✅ 防止連續點擊
  modal.style.pointerEvents = 'none';
  if (loading) loading.style.display = 'block';

  callApi({
    action: 'assignJudgeToPosition_admin',
    game_id: currentAssignContext.gameId,
    role: currentAssignContext.role,
    judge_id: judge.user_id
  }, res => {

    modal.style.pointerEvents = 'auto';
    if (loading) loading.style.display = 'none';

    /* =========================
     * ❌ 1️⃣ 明確失敗（後端規則擋）
     * ========================= */
    if (res && res.result === 'error') {
      // ✅ 這裡就是你現在缺的
      showAssignMessage(
        `❌ ${res.message || '指派失敗'}`
      );
      return;
    }

    /* =========================
     * ✅ 2️⃣ 成功 or 非明確錯誤
     * ========================= */
    showAssignMessage('✅ 指派完成');
    closeJudgeModal();
    loadGames();   // ✅ 一定要重整
  });
}



function showAssignMessage(msg) {
  const box = document.createElement('div');
  box.textContent = msg;

  Object.assign(box.style, {
    position: 'fixed',
    top: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#323232',
    color: '#fff',
    padding: '10px 18px',
    borderRadius: '8px',
    fontSize: '14px',
    zIndex: 10000,
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
  });

  document.body.appendChild(box);

  setTimeout(() => {
    box.remove();
  }, 1600);
}


/* 改成掛在 window */
window.logout = function () {
  if (!confirm('確定要登出？')) return;
  localStorage.clear();
  location.replace('login.html');
};

// 取消指派功能
function cancelJudgeAssignment(gameId, role){

  if (!confirm('確定取消此裁判指派？')) {
    return;
  }

  callApi({
    action:'unassignJudge_admin',
    game_id:gameId,
    role:role
  }, res => {

    if (!res || res.result !== 'ok'){
      showAssignMessage(
        `❌ ${res?.message || '取消失敗'}`
      );
      return;
    }

    showAssignMessage('✅ 已取消指派');
    loadGames();
  });
}

// 取消裁判報名人員
function cancelJudgeSignup(
  gameId,
  role,
  userId
){

  if(!confirm('確定取消此人報名？')){
    return;
  }

  callApi({
    action:'cancelJudgeSignup_admin',
    game_id:gameId,
    role:role,
    user_id:userId
  }, res => {

    if(
      !res ||
      res.result !== 'ok'
    ){

      showAssignMessage(
        `❌ ${res?.message || '取消報名失敗'}`
      );

      return;
    }

    showAssignMessage(
      '✅ 已取消報名'
    );

    loadGames();

  });

}

/*********************************************************
 * KPI
 *********************************************************/
function renderKPI(){

  const requiredRoles = {
    0:[],
    1:['PU'],
    2:['PU','U1'],
    3:['PU','U1','U3'],
    4:['PU','U1','U2','U3']
  };

  const validGames =
    allGames.filter(g =>
     !g.is_locked &&
      Number(g.umpire_count ?? 0) > 0
    );

  const yearGames =
    new Set(
  
      validGames.map(
        g => String(g.game_id)
      )
  
    ).size;

  let vacancyCount = 0;
  let assignedCount = 0;
  let pendingGames = 0;

  validGames.forEach(game => {

    const activeRoles =
      requiredRoles[
        Number(game.umpire_count ?? 0)
      ] || [];

    if(activeRoles.length === 0){
      return;
    }

    let gameHasVacancy = false;

    activeRoles.forEach(role => {

      const pos =
        game.positions?.[role];

      if(
        isPositionFilled(pos)
      ){

        assignedCount++;

      }else{

        vacancyCount++;
        gameHasVacancy = true;

      }

    });

    if(gameHasVacancy){
      pendingGames++;
    }

  });

  setText(
    'kpiWeekGames',
    yearGames
  );

  setText(
    'kpiJudgeVacancy',
    vacancyCount
  );

  setText(
    'kpiAssigned',
    assignedCount
  );

  setText(
    'kpiPending',
    pendingGames
  );

  /* Sidebar 缺額 */

  const badge =
    document.getElementById(
      'judgeVacancyBadge'
    );

  if(badge){

    if(vacancyCount > 0){

      badge.textContent =
        `${vacancyCount}缺`;

      badge.classList.remove(
        'hidden'
      );

    }else{

      badge.classList.add(
        'hidden'
      );

    }

  }

}

// 月份篩選
function renderMonthTabs(){

  const box =
    document.getElementById(
      'monthTabs'
    );

  if(!box) return;

  const months = [
    ...new Set(
      allGames.map(g => {

        const d = new Date(g.date);

        return d.getMonth() + 1;

      })
    )
  ].sort((a,b)=>a-b);

  box.innerHTML = `

    <button
      onclick="changeMonthFilter('ALL')"
      class="
      px-3 py-1 rounded-lg text-xs font-bold
      ${currentMonthFilter === 'ALL'
        ? 'bg-slate-900 text-white'
        : 'bg-slate-100'}
      ">

      全部

    </button>

    ${months.map(m=>`

      <button
        onclick="changeMonthFilter('${m}')"
        class="
        px-3 py-1 rounded-lg text-xs font-bold
        ${String(currentMonthFilter)===String(m)
          ? 'bg-slate-900 text-white'
          : 'bg-slate-100'}
        ">

        ${m}月

      </button>

    `).join('')}

  `;
}
