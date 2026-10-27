<script>
  function renderSidebar(active = '') {
  
    const isActive = key =>
      active === key
        ? 'bg-brand-600 text-white shadow-md'
        : 'hover:bg-slate-800 hover:text-white';
  
    return `
    <aside id="sidebar"
      class="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between shrink-0 shadow-xl border-r border-slate-800">
  
      <div>
  
        <div class="h-16 flex items-center space-x-3 px-6 bg-slate-950 border-b border-slate-800">
          <div class="bg-brand-600 p-2 rounded-xl text-white shadow-md">
            <i data-lucide="shield-check" class="w-5 h-5"></i>
          </div>
  
          <div>
            <h1 class="font-black text-white text-base tracking-wide">
              BBT 管理控制台
            </h1>
            <p class="text-[10px] text-slate-400">
              出勤與排班後端管理系統
            </p>
          </div>
        </div>
  
        <nav class="p-4 space-y-1 text-sm font-semibold">
  
          <div class="text-[11px] text-slate-500 font-bold px-3 py-2 uppercase tracking-wider">
            主控台
          </div>
  
          <a href="admin_dashboard.html"
             class="flex items-center space-x-3 px-3 py-2.5 rounded-xl transition ${isActive('dashboard')}">
            <i data-lucide="layout-dashboard" class="w-4 h-4"></i>
            <span>管理總覽</span>
          </a>
  
          <div class="text-[11px] text-slate-500 font-bold px-3 py-2 uppercase tracking-wider pt-4">
            賽事與排班
          </div>
  
          <a href="judge_dashboard_admin.html"
             class="flex items-center justify-between px-3 py-2.5 rounded-xl transition ${isActive('judge')}">
  
            <div class="flex items-center space-x-3">
              <i data-lucide="calendar-range" class="w-4 h-4"></i>
              <span>裁判排班</span>
            </div>
  
            <span id="judgeVacancyBadge"
                  class="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full hidden"></span>
  
          </a>
  
          <a href="record_dashboard_admin.html"
             class="flex items-center justify-between px-3 py-2.5 rounded-xl transition ${isActive('record')}">
  
            <div class="flex items-center space-x-3">
              <i data-lucide="file-spreadsheet" class="w-4 h-4"></i>
              <span>紀錄排班</span>
            </div>
  
            <span id="recordVacancyBadge"
                  class="bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full hidden"></span>
  
          </a>
  
          <a href="assignment_execution.html"
             class="flex items-center space-x-3 px-3 py-2.5 rounded-xl transition ${isActive('attendance')}">
  
            <i data-lucide="clipboard-check" class="w-4 h-4"></i>
            <span>出勤確認</span>
  
          </a>
  
          <div class="text-[11px] text-slate-500 font-bold px-3 py-2 uppercase tracking-wider pt-4">
            系統管理
          </div>
  
          <a href="admin_games.html"
             class="flex items-center space-x-3 px-3 py-2.5 rounded-xl transition ${isActive('games')}">
  
            <i data-lucide="calendar-days" class="w-4 h-4"></i>
            <span>賽事管理</span>
  
          </a>
  
          <a href="admin_users.html"
             class="flex items-center justify-between px-3 py-2.5 rounded-xl transition ${isActive('users')}">
  
            <div class="flex items-center space-x-3">
              <i data-lucide="users" class="w-4 h-4"></i>
              <span>帳號管理</span>
            </div>
  
            <span id="userCountBadge"
                  class="bg-slate-700 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
              -
            </span>
  
          </a>
  
          <div class="text-[11px] text-slate-500 font-bold px-3 py-2 uppercase tracking-wider pt-4">
            統計報表
          </div>
  
          <a href="judge_year_report.html"
             class="flex items-center space-x-3 px-3 py-2.5 rounded-xl transition ${isActive('judgeReport')}">
  
            <i data-lucide="bar-chart-3" class="w-4 h-4"></i>
            <span>裁判年度總表</span>
  
          </a>
  
          <a href="record_year_report.html"
             class="flex items-center space-x-3 px-3 py-2.5 rounded-xl transition ${isActive('recordReport')}">
  
            <i data-lucide="pie-chart" class="w-4 h-4"></i>
            <span>紀錄年度總表</span>
  
          </a>
  
          <a href="attendance_report.html"
             class="flex items-center space-x-3 px-3 py-2.5 rounded-xl transition ${isActive('attendanceReport')}">
  
            <i data-lucide="file-bar-chart" class="w-4 h-4"></i>
            <span>出勤報表</span>
  
          </a>
  
        </nav>
  
      </div>
  
      <div class="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
  
        <div class="flex items-center space-x-3">
  
          <div id="sidebarAvatar"
               class="w-9 h-9 rounded-xl bg-amber-500 text-slate-900 font-black flex items-center justify-center text-sm">
            -
          </div>
  
          <div>
  
            <div id="sidebarUserName"
                 class="text-xs font-bold text-white">
              -
            </div>
  
            <div id="sidebarUserRole"
                 class="text-[10px] text-amber-400">
              -
            </div>
  
          </div>
  
        </div>
  
        <button onclick="logout()"
                class="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg">
          <i data-lucide="log-out" class="w-4 h-4"></i>
        </button>
  
      </div>
  
    </aside>
  
    <div id="sidebarOverlay"
         class="hidden fixed inset-0 bg-black/40 z-[9998] md:hidden"></div>
    `;
  }
  
  function initSidebar(active,data={}){
  
    const root =
      document.getElementById('sidebarContainer');
  
    if(!root) return;
  
    root.innerHTML =
      renderSidebar(active);
  
    const session =
      JSON.parse(
        localStorage.getItem('session_user') || '{}'
      );
  
    const name =
      session.user_name ||
      session.name ||
      '未登入';
  
    document.getElementById('sidebarUserName').textContent = name;
    document.getElementById('sidebarUserRole').textContent =
      session.role || 'Admin';
  
    document.getElementById('sidebarAvatar').textContent =
      name.substring(0,1);
  
    if(data.judgeVacancy > 0){
  
      const el =
        document.getElementById('judgeVacancyBadge');
  
      el.textContent =
        `${data.judgeVacancy}缺`;
  
      el.classList.remove('hidden');
  
    }
  
    if(data.recordVacancy > 0){
  
      const el =
        document.getElementById('recordVacancyBadge');
  
      el.textContent =
        `${data.recordVacancy}缺`;
  
      el.classList.remove('hidden');
  
    }
  
    if(data.userCount !== undefined){
  
      document.getElementById('userCountBadge')
        .textContent = data.userCount;
  
    }
  
    const btn =
      document.getElementById('mobileMenuBtn');
  
    const sidebar =
      document.getElementById('sidebar');
  
    const overlay =
      document.getElementById('sidebarOverlay');
  
    if(btn && sidebar){
  
      btn.addEventListener('click', () => {
  
        sidebar.classList.toggle('mobile-open');
        overlay?.classList.toggle('hidden');
  
      });
  
    }
  
    if(overlay && sidebar){
  
      overlay.addEventListener('click', () => {
  
        sidebar.classList.remove('mobile-open');
        overlay.classList.add('hidden');
  
      });
  
    }
  
    if(window.lucide){
      lucide.createIcons();
    }
  
  }
  
  function logout(){
  
    if(!confirm('確定登出？')){
      return;
    }
  
    localStorage.clear();
    location.href = 'login.html';
  
  }
</script>
