/**
 * BodyGym - Elite Workout & Fitness Tracker App Logic
 */

const API_BASE = '/api';

// Safe SVG Placeholder (Dumbbell icon) to prevent image flickering
const FALLBACK_PLACEHOLDER_SVG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%23f97316' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6.5 6.5 11 11'/%3E%3Cpath d='m21 21-1-1'/%3E%3Cpath d='m3 3 1 1'/%3E%3Cpath d='m18 22 4-4'/%3E%3Cpath d='m2 6 4-4'/%3E%3Cpath d='m3 10 7-7'/%3E%3Cpath d='m14 21 7-7'/%3E%3C/svg%3E";

function getExerciseImageUrl(imgPath) {
  if (!imgPath || typeof imgPath !== 'string') return FALLBACK_PLACEHOLDER_SVG;
  if (imgPath.startsWith('http') || imgPath.startsWith('data:')) return imgPath;
  let cleanPath = imgPath.replace(/^\/+/, '');
  if (cleanPath.startsWith('media/')) cleanPath = cleanPath.replace(/^media\//, '');
  if (cleanPath === 'images/0025.png' || cleanPath === '0025.png') {
    cleanPath = 'images/0025-EIeI8Vf.jpg';
  }
  return `/media/${cleanPath}`;
}

// State
let appState = {
  currentTab: 'dashboard',
  exercises: [],
  exercisePage: 0,
  exercisePageSize: 20,
  hasMoreExercises: true,
  searchQuery: '',
  selectedBodyPart: '',
  selectedEquipment: '',
  
  // Live Workout Session
  isWorkoutActive: false,
  workoutStartTime: null,
  workoutTimerInterval: null,
  workoutSeconds: 0,
  currentWorkout: {
    routineName: 'Custom Workout',
    exercises: []
  },
  
  // Rest Timer
  restTimerInterval: null,
  restSecondsLeft: 0,
  
  // Modal State
  activeModalExercise: null,
  pickerTarget: 'liveWorkout', // 'liveWorkout' or 'newRoutine'
  newRoutineExercises: [],
  
  // Volume Chart
  volumeChartInstance: null
};

// Initialize App on DOM Load
document.addEventListener('DOMContentLoaded', () => {
  initIcons();
  setupEventListeners();
  loadDashboardData();
  loadExercises(true);
  loadRoutines();
  calculate1RM();
  calculateTDEE();
  
  // Register Service Worker for PWA
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW registration error', err));
  }
});

function initIcons() {
  if (window.lucide) {
    lucide.createIcons();
  }
}

// -------------------------------------------------------------
// TAB NAVIGATION
// -------------------------------------------------------------
function switchTab(tabId) {
  appState.currentTab = tabId;
  
  // Update Tab Panes
  document.querySelectorAll('.tab-pane').forEach(pane => {
    pane.classList.remove('active');
  });
  const targetPane = document.getElementById(`tab-${tabId}`);
  if (targetPane) {
    targetPane.classList.add('active');
  }
  
  // Update Mobile Bottom Nav
  document.querySelectorAll('.bottom-nav-item').forEach(item => {
    item.classList.remove('active');
    if (item.getAttribute('data-tab') === tabId) {
      item.classList.add('active');
    }
  });

  // Update Desktop Sidebar
  document.querySelectorAll('.sidebar-nav-item').forEach(item => {
    item.classList.remove('active');
    if (item.getAttribute('data-tab') === tabId) {
      item.classList.add('active');
    }
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Refresh tab-specific data
  if (tabId === 'dashboard') {
    loadDashboardData();
  } else if (tabId === 'analytics') {
    loadAnalyticsData();
  } else if (tabId === 'routines') {
    loadRoutines();
  }
  
  initIcons();
}

function setupEventListeners() {
  // Sidebar clicks
  document.querySelectorAll('.sidebar-nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const tab = item.getAttribute('data-tab');
      if (tab) switchTab(tab);
    });
  });
}

// -------------------------------------------------------------
// DASHBOARD & STATS
// -------------------------------------------------------------
async function loadDashboardData() {
  try {
    const res = await fetch(`${API_BASE}/workouts/stats`);
    if (!res.ok) return;
    const stats = await res.json();
    
    document.getElementById('dash-total-workouts').textContent = stats.totalWorkouts || 0;
    document.getElementById('dash-total-volume').textContent = (stats.totalVolumeKg || 0).toLocaleString();
    document.getElementById('dash-streak').textContent = stats.currentStreakDays || 0;
    
    // Quick recovery list
    const recoveryList = document.getElementById('dash-quick-recovery-list');
    if (recoveryList && stats.muscleRecoveries) {
      recoveryList.innerHTML = stats.muscleRecoveries.slice(0, 4).map(m => `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
          <span style="font-size: 0.85rem; text-transform: capitalize; color: #FFF;">${translateBodyPart(m.bodyPart)}</span>
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 80px; height: 6px; background: var(--border-color); border-radius: var(--radius-full); overflow: hidden;">
              <div style="width: ${m.recoveryPercentage}%; height: 100%; background: ${m.color};"></div>
            </div>
            <span style="font-size: 0.75rem; font-weight: 700; color: ${m.color}; min-width: 35px; text-align: right;">${m.recoveryPercentage}%</span>
          </div>
        </div>
      `).join('');
    }

    // Load recent workouts
    loadRecentWorkouts();
  } catch (err) {
    console.error('Failed to load dashboard data:', err);
  }
}

async function loadRecentWorkouts() {
  try {
    const res = await fetch(`${API_BASE}/workouts/history`);
    if (!res.ok) return;
    const logs = await res.json();
    
    const container = document.getElementById('dash-recent-workouts');
    if (!container) return;

    if (logs.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 24px; color: var(--text-dim);">
          <i data-lucide="clipboard-list" style="width: 40px; height: 40px; margin-bottom: 8px; opacity: 0.5;"></i>
          <p>Chưa có buổi tập nào. Hãy bấm <b>"Tập Ngay"</b> để bắt đầu ghi lại hành trình thể hình!</p>
        </div>
      `;
    } else {
      container.innerHTML = logs.slice(0, 3).map(log => `
        <div style="padding: 12px; background: rgba(255,255,255,0.02); border-radius: var(--radius-md); border: 1px solid var(--border-color); margin-bottom: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span style="font-weight: 700; color: #FFF; font-size: 1rem;">${log.routineName}</span>
            <span style="font-size: 0.75rem; color: var(--text-dim);">${formatDateTime(log.loggedAt)}</span>
          </div>
          <div style="display: flex; gap: 14px; font-size: 0.8rem; color: var(--text-muted);">
            <span>⏱️ <b>${formatDuration(log.durationSeconds)}</b></span>
            <span>🏋️ <b>${(log.totalVolumeKg || 0).toLocaleString()} kg</b></span>
            <span>🔢 <b>${log.totalSets} sets</b></span>
            ${log.prCount > 0 ? `<span style="color: #F59E0B;">🏆 <b>${log.prCount} PRs</b></span>` : ''}
          </div>
        </div>
      `).join('');
    }
    initIcons();
  } catch (e) {
    console.error(e);
  }
}

// -------------------------------------------------------------
// EXERCISE EXPLORER (1,324 EXERCISES)
// -------------------------------------------------------------
let searchDebounceTimer;
function handleExerciseSearch() {
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    const input = document.getElementById('exercise-search-input');
    appState.searchQuery = input ? input.value.trim() : '';
    loadExercises(true);
  }, 300);
}

function filterByBodyPart(bodyPart) {
  appState.selectedBodyPart = bodyPart;
  
  document.querySelectorAll('#bodypart-filters .filter-pill').forEach(pill => {
    pill.classList.remove('active');
    if (bodyPart === '' && pill.textContent.includes('Tất cả')) {
      pill.classList.add('active');
    } else if (bodyPart && pill.getAttribute('onclick') && pill.getAttribute('onclick').includes(bodyPart)) {
      pill.classList.add('active');
    }
  });
  loadExercises(true);
}

function switchTabAndFilter(bodyPart) {
  switchTab('exercises');
  filterByBodyPart(bodyPart);
}

function handleEquipmentFilter() {
  const select = document.getElementById('equipment-select');
  appState.selectedEquipment = select ? select.value : '';
  loadExercises(true);
}

async function loadExercises(reset = false) {
  if (reset) {
    appState.exercisePage = 0;
    appState.exercises = [];
    appState.hasMoreExercises = true;
  }

  const container = document.getElementById('exercise-list-container');
  if (!container) return;

  if (reset) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">
        <i data-lucide="loader" style="animation: spin 1s linear infinite; width: 32px; height: 32px;"></i>
        <p style="margin-top: 10px;">Đang tải danh sách bài tập...</p>
      </div>
    `;
    initIcons();
  }

  try {
    const params = new URLSearchParams();
    params.append('page', appState.exercisePage);
    params.append('size', appState.exercisePageSize);
    if (appState.searchQuery && appState.searchQuery.trim()) {
      params.append('search', appState.searchQuery.trim());
    }
    if (appState.selectedBodyPart && appState.selectedBodyPart.trim() && appState.selectedBodyPart !== 'all') {
      params.append('bodyPart', appState.selectedBodyPart.trim());
    }
    if (appState.selectedEquipment && appState.selectedEquipment.trim() && appState.selectedEquipment !== 'all') {
      params.append('equipment', appState.selectedEquipment.trim());
    }

    const res = await fetch(`${API_BASE}/exercises?${params.toString()}`);
    if (!res.ok) throw new Error('API Error');
    const data = await res.json();

    const exercises = data.content || [];
    const totalCount = data.totalElements || 0;

    const countDisplay = document.getElementById('exercise-count-display');
    if (countDisplay) countDisplay.textContent = totalCount.toLocaleString();

    if (reset) {
      appState.exercises = exercises;
      container.innerHTML = '';
    } else {
      appState.exercises.push(...exercises);
    }

    appState.hasMoreExercises = !data.last;

    const btnLoadMore = document.getElementById('btn-load-more');
    if (btnLoadMore) {
      btnLoadMore.style.display = appState.hasMoreExercises ? 'inline-flex' : 'none';
    }

    if (appState.exercises.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 50px; color: var(--text-dim);">
          <i data-lucide="frown" style="width: 48px; height: 48px; margin-bottom: 12px;"></i>
          <h3>Không tìm thấy bài tập nào phù hợp</h3>
          <p style="font-size: 0.9rem; margin-top: 6px;">Hãy thử đổi từ khóa tìm kiếm hoặc lọc theo nhóm cơ khác.</p>
        </div>
      `;
      initIcons();
      return;
    }

    exercises.forEach(ex => {
      const card = createExerciseCardElement(ex);
      container.appendChild(card);
    });

    initIcons();

  } catch (err) {
    console.error('Failed to load exercises:', err);
    if (reset) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--danger);">
          <i data-lucide="alert-circle" style="width: 40px; height: 40px; margin-bottom: 8px;"></i>
          <p>Lỗi kết nối máy chủ. Vui lòng thử lại.</p>
        </div>
      `;
      initIcons();
    }
  }
}

function loadMoreExercises() {
  if (appState.hasMoreExercises) {
    appState.exercisePage++;
    loadExercises(false);
  }
}

function createExerciseCardElement(ex) {
  const card = document.createElement('div');
  card.className = 'exercise-card';
  card.onclick = () => openExerciseDetailModal(ex.id);

  const imgSrc = getExerciseImageUrl(ex.image);

  card.innerHTML = `
    <div class="exercise-thumb-wrapper">
      <img src="${imgSrc}" alt="${ex.name}" loading="lazy" onerror="this.onerror=null; this.src='${FALLBACK_PLACEHOLDER_SVG}';">
      <div class="exercise-badge-group">
        <span class="badge badge-bodypart">${ex.bodyPart || 'All'}</span>
        <span class="badge badge-equip">${ex.equipment || 'General'}</span>
      </div>
    </div>
    <div class="exercise-info">
      <div>
        <h4 class="exercise-name">${ex.name}</h4>
        <div class="exercise-target">Cơ mục tiêu: <span>${ex.target || 'General'}</span></div>
      </div>
      <div style="margin-top: 10px; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 0.75rem; color: var(--text-dim);">${ex.muscleGroup || ''}</span>
        <span style="color: var(--primary); font-size: 0.8rem; font-weight: 700; display: flex; align-items: center; gap: 2px;">
          Chi tiết <i data-lucide="chevron-right" style="width: 14px; height: 14px;"></i>
        </span>
      </div>
    </div>
  `;
  return card;
}

// -------------------------------------------------------------
// EXERCISE DETAIL MODAL & VIETNAMESE TRANSLATION
// -------------------------------------------------------------
let currentInstructionLang = 'vi';

async function openExerciseDetailModal(exerciseId) {
  try {
    const res = await fetch(`${API_BASE}/exercises/${exerciseId}`);
    if (!res.ok) return;
    const ex = await res.json();
    appState.activeModalExercise = ex;

    document.getElementById('modal-ex-title').textContent = ex.name;
    document.getElementById('modal-ex-bodypart').textContent = translateBodyPart(ex.bodyPart);
    document.getElementById('modal-ex-target').textContent = `Cơ chính: ${translateTarget(ex.target)}`;
    document.getElementById('modal-ex-equip').textContent = translateEquipment(ex.equipment);
    document.getElementById('modal-ex-secondary').textContent = translateSecondaryMuscles(ex.secondaryMuscles || ex.muscleGroup);

    const gifElem = document.getElementById('modal-ex-gif');
    if (gifElem) {
      gifElem.onerror = function() {
        this.onerror = null;
        this.src = FALLBACK_PLACEHOLDER_SVG;
      };
      gifElem.src = ex.gifUrl ? `/media/${ex.gifUrl}` : getExerciseImageUrl(ex.image);
    }

    // Default to Vietnamese instructions
    currentInstructionLang = 'vi';
    updateInstructionLangPills('vi');
    renderModalInstructions('vi');

    // Render Coaching Pro Tips
    const tipElem = document.getElementById('modal-ex-coach-tip-text');
    if (tipElem) {
      tipElem.textContent = generateCoachingTips(ex);
    }

    openModal('modal-exercise-detail');
  } catch (err) {
    console.error(err);
  }
}

function switchInstructionLang(lang) {
  currentInstructionLang = lang;
  updateInstructionLangPills(lang);
  renderModalInstructions(lang);
}

function updateInstructionLangPills(lang) {
  document.querySelectorAll('#instruction-lang-pills .filter-pill').forEach(pill => {
    pill.classList.remove('active');
    if (pill.getAttribute('onclick') && pill.getAttribute('onclick').includes(`'${lang}'`)) {
      pill.classList.add('active');
    }
  });
}

function renderModalInstructions(lang) {
  const instructionsElem = document.getElementById('modal-ex-instructions');
  if (!instructionsElem || !appState.activeModalExercise) return;

  const ex = appState.activeModalExercise;
  let stepsArr = [];

  if (ex.instructionStepsJson) {
    try {
      const stepsObj = JSON.parse(ex.instructionStepsJson);
      if (lang === 'vi') {
        // Translate English steps into natural Vietnamese
        const enSteps = stepsObj.en || [];
        stepsArr = enSteps.map(s => translateStepToVietnamese(s, ex));
      } else {
        stepsArr = stepsObj[lang] || stepsObj.en || [];
      }
    } catch (e) {
      stepsArr = [];
    }
  }

  if (stepsArr.length > 0) {
    instructionsElem.innerHTML = `
      <ol style="padding-left: 20px; display: flex; flex-direction: column; gap: 10px;">
        ${stepsArr.map(s => `<li style="line-height: 1.55;">${s}</li>`).join('')}
      </ol>
    `;
  } else {
    const rawText = ex.instructions || 'Chưa có thông tin hướng dẫn chi tiết.';
    instructionsElem.textContent = lang === 'vi' ? translateStepToVietnamese(rawText, ex) : rawText;
  }
}

// Intelligent Gym Coach Vietnamese Translator
function translateStepToVietnamese(text, ex) {
  if (!text) return '';
  let s = text.trim();

  // Pattern dictionary for standard gym instructions
  const replacements = [
    // Posture & Setup
    [/lie flat on your back on a bench with your feet flat on the ground/gi, 'Nằm ngửa phẳng lưng trên ghế tập, hai bàn chân đặt vững chắc bám sàn'],
    [/lie flat on your back with your knees bent and feet flat on the ground/gi, 'Nằm ngửa trên thảm tập, gập nhẹ hai đầu gối và đặt hai bàn chân phẳng trên sàn'],
    [/lie flat on your back on a bench/gi, 'Nằm ngửa thẳng lưng trên ghế tập phẳng'],
    [/lie flat on your back/gi, 'Nằm ngửa thẳng lưng trên thảm hoặc sàn tập'],
    [/lie face down on the bench/gi, 'Nằm sấp trên ghế tập'],
    [/stand upright with feet shoulder-width apart/gi, 'Đứng thẳng người, hai chân mở rộng bằng vai'],
    [/stand upright with your feet shoulder-width apart/gi, 'Đứng thẳng người vững chắc, hai chân rộng bằng vai'],
    [/stand with your feet shoulder-width apart/gi, 'Đứng hai chân mở rộng bằng vai'],
    [/stand with your feet hip-width apart/gi, 'Đứng thẳng, hai chân mở rộng bằng hông'],
    [/sit on the bench with your back straight/gi, 'Ngồi thẳng lưng trên ghế tập, ưỡn ngực tự nhiên'],
    [/sit on the machine with your back flat against the pad/gi, 'Ngồi vào máy tập, lưng áp sát vào đệm tựa'],
    [/sit on the seat with your back straight/gi, 'Ngồi vững trên ghế, giữ lưng thẳng'],
    [/adjust the seat so that/gi, 'Điều chỉnh độ cao ghế ngồi sao cho'],
    
    // Grips & Holding
    [/grasp the barbell with an overhand grip slightly wider than shoulder-width/gi, 'Nắm chặt thanh tạ đòn với lòng bàn tay úp xuống, khoảng cách tay rộng hơn vai một chút'],
    [/grasp the barbell with an overhand grip/gi, 'Nắm chắc thanh tạ đòn với lòng bàn tay úp (Overhand grip)'],
    [/grasp the barbell with an underhand grip/gi, 'Nắm thanh tạ đòn với lòng bàn tay ngửa lên (Underhand grip)'],
    [/grasp the handles with an overhand grip/gi, 'Nắm chắc hai tay cầm của máy tập'],
    [/hold a dumbbell in each hand with your palms facing each other/gi, 'Mỗi tay cầm một quả tạ đơn, hai lòng bàn tay hướng vào nhau (Neutral grip)'],
    [/hold a dumbbell in each hand/gi, 'Mỗi tay cầm chắc một quả tạ đơn'],
    [/hold the dumbbells at shoulder height/gi, 'Giữ tạ đơn ở độ cao ngang vai'],
    [/hold the barbell across your upper back/gi, 'Đặt thanh tạ đòn ngang phần cơ cầu vai trên (High bar)'],
    [/hold the cable handles at shoulder level/gi, 'Cầm tay kéo cáp ở độ cao ngang tầm vai'],

    // Execution & Motion
    [/unrack the barbell and lower it slowly towards your chest/gi, 'Nhấc tạ ra khỏi giá đỡ, từ từ hạ thanh tạ có kiểm soát xuống ngang ngực giữa (hít sâu vào)'],
    [/lower the barbell to your chest/gi, 'Từ từ hạ thanh tạ đòn xuống chạm nhẹ vùng ngực (hít vào)'],
    [/lower the dumbbells slowly towards your chest/gi, 'Từ từ hạ tạ đơn xuống hai bên ngực (hít vào sâu)'],
    [/lower the barbell until your thighs are parallel to the floor/gi, 'Khuỵu gối hạ người xuống cho đến khi đùi song song với mặt sàn (hít sâu)'],
    [/lower your body until your thighs are parallel to the floor/gi, 'Hạ thấp người xuống cho đến khi đùi song song với sàn nhà (hít sâu vào)'],
    [/lower the weight slowly and with control/gi, 'Từ từ hạ mức tạ xuống thật chậm và có kiểm soát (pha hít vào)'],
    [/lower the weight slowly/gi, 'Từ từ hạ tạ xuống có kiểm soát'],
    [/press the barbell back up to the starting position/gi, 'Dùng lực cơ ngực đẩy mạnh thanh tạ thẳng đứng trở lại vị trí ban đầu (thở dứt khoát ra)'],
    [/press the dumbbells back up/gi, 'Dùng lực cơ đẩy hai quả tạ đơn lên lại vị trí ban đầu (thở ra)'],
    [/push through your heels to return to the starting position/gi, 'Dồn lực vào gót chân đẩy người đứng thẳng dậy về vị trí ban đầu (thở mạnh ra)'],
    [/push through your heels/gi, 'Dồn lực vào gót chân đẩy mạnh lên'],
    [/pull the barbell towards your lower chest/gi, 'Kéo thanh tạ đòn hướng về phía bụng dưới / ngực dưới (thở ra)'],
    [/pull the bar down to your chest/gi, 'Kéo thanh đòn xuống chạm nhẹ vùng ngực trên (thở ra và siết lưng xô)'],
    [/pull the handles towards your torso/gi, 'Kéo tay cầm về sát thân người, ép chặt hai bả vai'],
    [/curl the dumbbells towards your shoulders/gi, 'Gập tạ đơn lên hướng về phía vai (siết chặt bắp tay trước, thở ra)'],
    [/raise the dumbbells to the sides until they reach shoulder height/gi, 'Nâng hai tạ đơn sang hai bên cho đến khi ngang tầm vai (thở ra)'],
    [/raise your arms to the sides/gi, 'Nâng hai cánh tay sang ngang'],
    [/extend your arms straight out/gi, 'Duỗi thẳng hai cánh tay'],
    [/extend your arms/gi, 'Duỗi thẳng hai tay'],

    // Contraction & Core Cues
    [/squeeze your shoulder blades together at the top of the movement/gi, 'Siết ép hai bả vai sát vào nhau ở đỉnh động tác để kích hoạt tối đa cơ lưng xô'],
    [/squeeze your shoulder blades together/gi, 'Ép chặt hai bả vai vào nhau'],
    [/contract your biceps at the top of the movement/gi, 'Gồng siết cơ bắp tay trước ở đỉnh động tác trong 1 giây'],
    [/contract your pectorals/gi, 'Siết chặt cơ ngực'],
    [/contract your glutes at the top/gi, 'Siết chặt cơ mông ở đỉnh động tác'],
    [/engaging your abs/gi, 'Gồng chặt cơ bụng'],
    [/keep your back straight and core engaged/gi, 'Luôn giữ lưng thẳng tự nhiên và gồng siết cơ bụng (Core)'],
    [/keep your back straight throughout the movement/gi, 'Giữ lưng thẳng trong suốt quá trình thực hiện'],
    [/keep your elbows close to your body/gi, 'Giữ hai khuỷu tay khép sát vào thân người'],
    [/do not lock your elbows/gi, 'Tránh khóa cứng khớp khuỷu tay'],
    [/do not lock your knees/gi, 'Không khóa cứng khớp gối'],
    [/pause for a moment at the top/gi, 'Dừng lại giữ 1 nhịp (1-2 giây) ở đỉnh động tác'],
    [/pause for a moment/gi, 'Dừng lại 1 giây cảm nhận cơ'],
    [/repeat for the desired number of repetitions/gi, 'Lặp lại động tác cho đủ số lần (Reps) quy định của hiệp tập.'],
    [/repeat on the other side/gi, 'Đổi bên và lặp lại tương tự cho bên còn lại.'],
    [/return to the starting position/gi, 'Trở về vị trí chuẩn bị ban đầu'],
    [/slowly return to the starting position/gi, 'Từ từ đưa tạ trở về vị trí ban đầu có kiểm soát'],
    [/inhale as you lower/gi, 'Hít sâu vào khi hạ tạ'],
    [/exhale as you push/gi, 'Thở mạnh ra khi đẩy tạ'],
    [/exhale as you lift/gi, 'Thở dứt khoát khi nâng tạ']
  ];

  for (const [pattern, viText] of replacements) {
    s = s.replace(pattern, viText);
  }

  // Capitalize first letter
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function generateCoachingTips(ex) {
  const bodyPart = (ex.bodyPart || '').toLowerCase();
  const target = (ex.target || '').toLowerCase();

  if (bodyPart.includes('chest')) {
    return '💡 Mẹo HLV: Giữ bả vai ép chặt vào ghế (Retract Scapula), ưỡn nhẹ ngực. Khi hạ tạ hít sâu trong 2-3 giây để giãn cơ ngực tối đa, khi đẩy tạ thở mạnh và siết ép cơ ngực vào trong.';
  } else if (bodyPart.includes('back')) {
    return '💡 Mẹo HLV: Luôn kéo tạ bằng khuỷu tay và cơ lưng xô (Lead with elbows), tránh dùng lực bắp tay trước giật tạ. Giữ lưng thẳng để tránh áp lực lên cột sống thắt lưng.';
  } else if (bodyPart.includes('legs')) {
    return '💡 Mẹo HLV: Dồn trọng tâm vào giữa bàn chân và gót chân. Mở gối theo hướng mũi chân khi hạ người, hít sâu gồng chặt ổ bụng (Bracing) để cố định cột sống.';
  } else if (bodyPart.includes('shoulders')) {
    return '💡 Mẹo HLV: Giữ khớp vai ổn định, không nhún vai kéo căng cơ cổ. Khi nâng tạ sang bên (Lateral raise), hơi nghiêng người về trước 10 độ để tác động chuẩn vào cơ vai ngang.';
  } else if (bodyPart.includes('arms')) {
    return '💡 Mẹo HLV: Cố định vị trí khuỷu tay sát thân người, không đung đưa thân người lấy đà. Siết chặt bắp tay ở đỉnh động tác trong 1 giây để bơm máu tối đa.';
  } else if (bodyPart.includes('waist')) {
    return '💡 Mẹo HLV: Tập trung cuộn xương chậu về phía ngực thay vì chỉ gập cổ. Thở hết toàn bộ không khí ra ngoài khi siết bụng để kích hoạt cơ bụng sâu (Transverse Abdominis).';
  } else {
    return '💡 Mẹo HLV: Thực hiện động tác chậm rãi có kiểm soát (2 giây hạ, 1 giây nâng). Hít thở đều đặn và khởi động kỹ các khớp trước khi vào set tạ nặng.';
  }
}

function translateTarget(target) {
  if (!target) return 'Cơ bắp toàn thân';
  const dict = {
    'pectorals': 'Cơ ngực (Pectorals)',
    'lats': 'Cơ lưng xô (Lats)',
    'upper back': 'Cơ lưng trên (Traps & Rhomboids)',
    'spine': 'Cơ dựng sống / Lưng dưới (Spine)',
    'delts': 'Cơ vai (Deltoids)',
    'biceps': 'Cơ tay trước (Biceps)',
    'triceps': 'Cơ tay sau (Triceps)',
    'quads': 'Cơ đùi trước (Quadriceps)',
    'hamstrings': 'Cơ đùi sau (Hamstrings)',
    'glutes': 'Cơ mông (Glutes)',
    'calves': 'Cơ bắp chân (Calves)',
    'abs': 'Cơ bụng (Abdominals)',
    'cardiovascular system': 'Hệ tim mạch / Đốt calo'
  };
  return dict[target.toLowerCase()] || target;
}

function translateEquipment(equip) {
  if (!equip) return 'Dụng cụ chung';
  const dict = {
    'barbell': 'Tạ đòn (Barbell)',
    'dumbbell': 'Tạ đơn (Dumbbell)',
    'cable': 'Máy kéo cáp (Cable)',
    'body weight': 'Trọng lượng cơ thể (Bodyweight)',
    'leverage machine': 'Máy khối (Leverage Machine)',
    'smith machine': 'Khung gánh Smith',
    'kettlebell': 'Tạ bình vôi (Kettlebell)',
    'band': 'Dây kháng lực (Band)',
    'roller': 'Con lăn (Roller)'
  };
  return dict[equip.toLowerCase()] || equip;
}

function translateSecondaryMuscles(secs) {
  if (!secs) return 'Không có';
  return secs.split(',').map(s => translateTarget(s.trim())).join(', ');
}

function addCurrentModalExerciseToWorkout() {
  if (!appState.activeModalExercise) return;
  addExerciseToWorkoutSession(appState.activeModalExercise);
  closeModal('modal-exercise-detail');
  switchTab('workout');
  showToast(`Đã thêm "${appState.activeModalExercise.name}" vào buổi tập!`);
}

// -------------------------------------------------------------
// LIVE WORKOUT PLAYER (HEVY / STRONG STYLE)
// -------------------------------------------------------------
async function quickStartWorkout() {
  if (!appState.isWorkoutActive) {
    appState.isWorkoutActive = true;
    appState.workoutSeconds = 0;
    appState.workoutStartTime = new Date();
    appState.currentWorkout = {
      routineName: 'Custom Live Workout',
      exercises: []
    };
    
    // Fetch exercise 0025 with full verified metadata from API
    try {
      const res = await fetch(`${API_BASE}/exercises/0025`);
      if (res.ok) {
        const ex = await res.json();
        addExerciseToWorkoutSession(ex);
      } else {
        addExerciseToWorkoutSession({
          id: '0025',
          name: 'barbell bench press',
          bodyPart: 'chest',
          target: 'pectorals',
          equipment: 'barbell',
          image: 'images/0025-EIeI8Vf.jpg',
          gifUrl: 'videos/0025-EIeI8Vf.gif'
        });
      }
    } catch (e) {
      addExerciseToWorkoutSession({
        id: '0025',
        name: 'barbell bench press',
        bodyPart: 'chest',
        target: 'pectorals',
        equipment: 'barbell',
        image: 'images/0025-EIeI8Vf.jpg',
        gifUrl: 'videos/0025-EIeI8Vf.gif'
      });
    }

    startWorkoutTimer();
  }
  switchTab('workout');
}

function startRoutineById(routineId) {
  fetch(`${API_BASE}/routines/${routineId}`)
    .then(r => r.json())
    .then(routine => {
      appState.isWorkoutActive = true;
      appState.workoutSeconds = 0;
      appState.workoutStartTime = new Date();
      appState.currentWorkout = {
        routineName: routine.name,
        exercises: []
      };

      try {
        const exList = JSON.parse(routine.exercisesJson || '[]');
        exList.forEach(item => {
          const sets = [];
          const numSets = item.defaultSets || 3;
          for (let i = 1; i <= numSets; i++) {
            sets.push({
              setNumber: i,
              type: 'N',
              weightKg: 60,
              reps: item.targetReps || 10,
              completed: false,
              isPr: false
            });
          }
          appState.currentWorkout.exercises.push({
            id: item.exerciseId,
            name: item.exerciseName,
            bodyPart: item.bodyPart,
            target: item.target,
            equipment: item.equipment,
            image: item.image,
            gifUrl: item.gifUrl,
            sets: sets
          });
        });
      } catch (e) {
        console.error(e);
      }

      startWorkoutTimer();
      renderLiveWorkout();
      switchTab('workout');
      showToast(`Bắt đầu giáo án "${routine.name}"! 🔥`);
    })
    .catch(e => console.error(e));
}

function startWorkoutTimer() {
  clearInterval(appState.workoutTimerInterval);
  appState.workoutTimerInterval = setInterval(() => {
    appState.workoutSeconds++;
    const timerElem = document.getElementById('live-timer-text');
    if (timerElem) {
      timerElem.textContent = formatTimer(appState.workoutSeconds);
    }
  }, 1000);
}

function addExerciseToWorkoutSession(ex) {
  const existing = appState.currentWorkout.exercises.find(e => e.id === ex.id);
  if (existing) {
    addSetToExercise(ex.id);
    return;
  }

  const defaultSets = [
    { setNumber: 1, type: 'W', weightKg: 40, reps: 12, completed: false, isPr: false },
    { setNumber: 2, type: 'N', weightKg: 60, reps: 10, completed: false, isPr: false },
    { setNumber: 3, type: 'N', weightKg: 70, reps: 8, completed: false, isPr: false }
  ];

  appState.currentWorkout.exercises.push({
    id: ex.id,
    name: ex.name,
    bodyPart: ex.bodyPart,
    target: ex.target,
    equipment: ex.equipment,
    image: ex.image,
    gifUrl: ex.gifUrl,
    sets: defaultSets
  });

  renderLiveWorkout();
}

function renderLiveWorkout() {
  const titleElem = document.getElementById('current-workout-title');
  if (titleElem) {
    titleElem.textContent = appState.currentWorkout.routineName || 'Custom Live Workout';
  }

  const container = document.getElementById('live-workout-exercises-list');
  if (!container) return;

  if (appState.currentWorkout.exercises.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px; background: var(--bg-card); border-radius: var(--radius-md); border: 1px dashed var(--border-color);">
        <i data-lucide="dumbbell" style="width: 48px; height: 48px; color: var(--text-dim); margin-bottom: 10px;"></i>
        <h3>Chưa có bài tập nào trong buổi này</h3>
        <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 6px;">Bấm "+ Thêm Bài Tập" bên dưới để chọn bài tập!</p>
      </div>
    `;
    initIcons();
    return;
  }

  container.innerHTML = appState.currentWorkout.exercises.map((ex, exIdx) => {
    const imgSrc = getExerciseImageUrl(ex.image);
    return `
    <div class="workout-exercise-block">
      <div class="workout-exercise-header">
        <div style="display: flex; align-items: center; gap: 10px;">
          <img src="${imgSrc}" alt="${ex.name}" style="width: 44px; height: 44px; border-radius: var(--radius-sm); object-fit: contain; background: #0B0F17;" onerror="this.onerror=null; this.src='${FALLBACK_PLACEHOLDER_SVG}';">
          <div>
            <h4 style="font-size: 1.1rem; color: #FFF; text-transform: capitalize;">${ex.name}</h4>
            <span style="font-size: 0.75rem; color: var(--primary); text-transform: uppercase;">${translateBodyPart(ex.bodyPart)} · ${ex.equipment}</span>
          </div>
        </div>
        <button onclick="removeExerciseFromWorkout(${exIdx})" style="background: transparent; border: none; color: var(--text-dim); cursor: pointer; padding: 6px;">
          <i data-lucide="trash-2" style="width: 18px; height: 18px;"></i>
        </button>
      </div>

      <table class="workout-sets-table">
        <thead>
          <tr>
            <th style="width: 50px;">SET</th>
            <th style="width: 80px;">LOẠI</th>
            <th>KG (TẠ)</th>
            <th>REPS</th>
            <th style="width: 60px;">XONG</th>
          </tr>
        </thead>
        <tbody>
          ${ex.sets.map((set, setIdx) => `
            <tr>
              <td><span class="set-num-badge">${set.setNumber}</span></td>
              <td>
                <select class="set-input" style="width: 70px; font-size: 0.8rem;" onchange="updateSetType(${exIdx}, ${setIdx}, this.value)">
                  <option value="W" ${set.type === 'W' ? 'selected' : ''}>Warmup</option>
                  <option value="N" ${set.type === 'N' ? 'selected' : ''}>Normal</option>
                  <option value="D" ${set.type === 'D' ? 'selected' : ''}>Drop</option>
                  <option value="F" ${set.type === 'F' ? 'selected' : ''}>Failure</option>
                </select>
              </td>
              <td>
                <input type="number" class="set-input" value="${set.weightKg}" min="0" step="0.5" onchange="updateSetWeight(${exIdx}, ${setIdx}, this.value)">
              </td>
              <td>
                <input type="number" class="set-input" value="${set.reps}" min="1" max="100" onchange="updateSetReps(${exIdx}, ${setIdx}, this.value)">
              </td>
              <td>
                <button class="btn-set-check ${set.completed ? 'checked' : ''}" onclick="toggleSetComplete(${exIdx}, ${setIdx})">
                  <i data-lucide="${set.completed ? 'check' : 'circle'}" style="width: 18px; height: 18px;"></i>
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="padding: 10px 16px; border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end;">
        <button class="filter-pill" style="font-size: 0.8rem;" onclick="addSetToExercise('${ex.id}')">
          + Thêm Set
        </button>
      </div>
    </div>
  `;
  }).join('');

  initIcons();
}

function updateSetType(exIdx, setIdx, val) {
  if (appState.currentWorkout.exercises[exIdx]) {
    appState.currentWorkout.exercises[exIdx].sets[setIdx].type = val;
  }
}

function updateSetWeight(exIdx, setIdx, val) {
  if (appState.currentWorkout.exercises[exIdx]) {
    appState.currentWorkout.exercises[exIdx].sets[setIdx].weightKg = parseFloat(val) || 0;
  }
}

function updateSetReps(exIdx, setIdx, val) {
  if (appState.currentWorkout.exercises[exIdx]) {
    appState.currentWorkout.exercises[exIdx].sets[setIdx].reps = parseInt(val) || 0;
  }
}

function toggleSetComplete(exIdx, setIdx) {
  const set = appState.currentWorkout.exercises[exIdx].sets[setIdx];
  set.completed = !set.completed;
  
  if (set.completed) {
    // Trigger audio beep & rest timer
    playTone(600, 0.1);
    startRestTimer(60); // Auto 60s rest timer
  }

  renderLiveWorkout();
}

function addSetToExercise(exerciseId) {
  const ex = appState.currentWorkout.exercises.find(e => e.id === exerciseId);
  if (!ex) return;
  const lastSet = ex.sets[ex.sets.length - 1];
  const newSetNum = ex.sets.length + 1;
  ex.sets.push({
    setNumber: newSetNum,
    type: 'N',
    weightKg: lastSet ? lastSet.weightKg : 50,
    reps: lastSet ? lastSet.reps : 10,
    completed: false,
    isPr: false
  });
  renderLiveWorkout();
}

function removeExerciseFromWorkout(index) {
  appState.currentWorkout.exercises.splice(index, 1);
  renderLiveWorkout();
}

function cancelCurrentWorkout() {
  if (confirm('Bạn có chắc chắn muốn hủy buổi tập hiện tại?')) {
    clearInterval(appState.workoutTimerInterval);
    appState.isWorkoutActive = false;
    appState.currentWorkout.exercises = [];
    switchTab('dashboard');
    showToast('Đã hủy buổi tập.');
  }
}

async function finishCurrentWorkout() {
  if (appState.currentWorkout.exercises.length === 0) {
    alert('Vui lòng thêm ít nhất 1 bài tập trước khi hoàn thành!');
    return;
  }

  clearInterval(appState.workoutTimerInterval);

  // Compute Volume & Stats
  let totalVolume = 0;
  let totalSets = 0;
  let totalReps = 0;
  let trainedPartsSet = new Set();

  appState.currentWorkout.exercises.forEach(ex => {
    if (ex.bodyPart) trainedPartsSet.add(ex.bodyPart);
    ex.sets.forEach(s => {
      if (s.completed) {
        totalVolume += (s.weightKg * s.reps);
        totalSets++;
        totalReps += s.reps;
      }
    });
  });

  const payload = {
    routineName: appState.currentWorkout.routineName || 'Custom Workout',
    durationSeconds: appState.workoutSeconds,
    totalVolumeKg: Math.round(totalVolume * 10.0) / 10.0,
    totalSets: totalSets,
    totalReps: totalReps,
    prCount: 1, // Celebratory PR
    trainedBodyParts: Array.from(trainedPartsSet),
    notes: 'Tập luyện sung sức!',
    exercises: appState.currentWorkout.exercises
  };

  try {
    const res = await fetch(`${API_BASE}/workouts/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      // Confetti celebration
      triggerConfetti();
      playTone(800, 0.2);

      appState.isWorkoutActive = false;
      appState.currentWorkout.exercises = [];
      
      alert(`🎉 CHÚC MỪNG BẠN ĐÃ HOÀN THÀNH BUỔI TẬP!\n\n⏱️ Thời gian: ${formatTimer(payload.durationSeconds)}\n🏋️ Tổng Volume: ${payload.totalVolumeKg.toLocaleString()} kg\n🔢 Số sets hoàn thành: ${payload.totalSets}`);
      
      switchTab('analytics');
    }
  } catch (err) {
    console.error('Failed to log workout:', err);
    alert('Có lỗi xảy ra khi lưu buổi tập lên máy chủ.');
  }
}

// -------------------------------------------------------------
// REST TIMER WITH SYNTHESIZED WEB AUDIO API
// -------------------------------------------------------------
function startRestTimer(seconds) {
  clearInterval(appState.restTimerInterval);
  appState.restSecondsLeft = seconds;
  
  const floatingTimer = document.getElementById('floating-rest-timer');
  const timerSecs = document.getElementById('floating-timer-seconds');
  if (floatingTimer) floatingTimer.style.display = 'flex';
  if (timerSecs) timerSecs.textContent = `${seconds}s`;

  appState.restTimerInterval = setInterval(() => {
    appState.restSecondsLeft--;
    if (timerSecs) timerSecs.textContent = `${appState.restSecondsLeft}s`;

    if (appState.restSecondsLeft <= 0) {
      clearInterval(appState.restTimerInterval);
      if (floatingTimer) floatingTimer.style.display = 'none';
      
      // Play Finish Alarm Tone (3 beeps)
      playAlarmChime();
      showToast('⏰ Hết giờ nghỉ! Sẵn sàng cho set tiếp theo!');
    }
  }, 1000);
}

function stopRestTimer() {
  clearInterval(appState.restTimerInterval);
  const floatingTimer = document.getElementById('floating-rest-timer');
  if (floatingTimer) floatingTimer.style.display = 'none';
}

function playTone(freq, duration) {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {
    console.log('Audio not supported or blocked', e);
  }
}

function playAlarmChime() {
  playTone(880, 0.15);
  setTimeout(() => playTone(880, 0.15), 200);
  setTimeout(() => playTone(1174.66, 0.35), 400);
}

// -------------------------------------------------------------
// ROUTINES & PROGRAMS
// -------------------------------------------------------------
async function loadRoutines() {
  try {
    const [presetsRes, customRes] = await Promise.all([
      fetch(`${API_BASE}/routines/presets`),
      fetch(`${API_BASE}/routines/custom`)
    ]);

    const presets = await presetsRes.json();
    const custom = await customRes.json();

    const presetsGrid = document.getElementById('preset-routines-grid');
    if (presetsGrid) {
      presetsGrid.innerHTML = presets.map(r => renderRoutineCard(r, true)).join('');
    }

    const customGrid = document.getElementById('custom-routines-grid');
    if (customGrid) {
      if (custom.length === 0) {
        customGrid.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 24px; color: var(--text-dim);">
            Chưa có giáo án tùy chỉnh nào. Bấm <b>"Tạo Giáo Án Mới"</b> để xây dựng lịch tập cá nhân!
          </div>
        `;
      } else {
        customGrid.innerHTML = custom.map(r => renderRoutineCard(r, false)).join('');
      }
    }

    initIcons();
  } catch (err) {
    console.error(err);
  }
}

function renderRoutineCard(routine, isPreset) {
  let exCount = 4;
  try {
    const list = JSON.parse(routine.exercisesJson || '[]');
    exCount = list.length;
  } catch (e) {}

  return `
    <div class="exercise-card" style="padding: 18px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
        <h4 style="font-size: 1.25rem; color: #FFF;">${routine.name}</h4>
        <span class="badge ${isPreset ? 'badge-bodypart' : 'badge-equip'}">${routine.level || 'All'}</span>
      </div>
      <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 14px; flex-grow: 1;">
        ${routine.description || 'Chương trình tập luyện tối ưu cho cơ thể.'}
      </p>
      <div style="font-size: 0.8rem; color: var(--text-dim); margin-bottom: 14px; display: flex; gap: 12px;">
        <span>⏱️ ${routine.estimatedMinutes || 60} phút</span>
        <span>💪 ${exCount} bài tập</span>
      </div>
      <button class="btn-primary" style="width: 100%; padding: 10px;" onclick="startRoutineById(${routine.id})">
        <i data-lucide="play" style="width: 16px; height: 16px;"></i> Bắt Đầu Giáo Án Này
      </button>
    </div>
  `;
}

function openCreateRoutineModal() {
  appState.newRoutineExercises = [];
  document.getElementById('new-routine-name').value = '';
  document.getElementById('new-routine-desc').value = '';
  renderNewRoutineExercises();
  openModal('modal-create-routine');
}

function renderNewRoutineExercises() {
  const container = document.getElementById('new-routine-exercises-list');
  if (!container) return;

  if (appState.newRoutineExercises.length === 0) {
    container.innerHTML = `
      <div style="font-size: 0.85rem; color: var(--text-dim); text-align: center; padding: 12px; border: 1px dashed var(--border-color); border-radius: var(--radius-sm);">
        Chưa có bài tập nào được thêm vào. Bấm "+ Thêm bài tập" ở trên.
      </div>
    `;
    return;
  }

  container.innerHTML = appState.newRoutineExercises.map((ex, idx) => `
    <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: #080C14; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
      <span style="font-weight: 600; font-size: 0.9rem; text-transform: capitalize; color: #FFF;">${ex.exerciseName}</span>
      <button onclick="removeExerciseFromNewRoutine(${idx})" style="background: transparent; border: none; color: var(--danger); cursor: pointer;">
        <i data-lucide="x" style="width: 16px; height: 16px;"></i>
      </button>
    </div>
  `).join('');
  initIcons();
}

function removeExerciseFromNewRoutine(idx) {
  appState.newRoutineExercises.splice(idx, 1);
  renderNewRoutineExercises();
}

async function saveCustomRoutine() {
  const name = document.getElementById('new-routine-name').value.trim();
  const desc = document.getElementById('new-routine-desc').value.trim();
  const level = document.getElementById('new-routine-level').value;
  const mins = parseInt(document.getElementById('new-routine-mins').value) || 60;

  if (!name) {
    alert('Vui lòng nhập tên giáo án!');
    return;
  }
  if (appState.newRoutineExercises.length === 0) {
    alert('Vui lòng thêm ít nhất 1 bài tập vào giáo án!');
    return;
  }

  const payload = {
    name: name,
    description: desc,
    level: level,
    estimatedMinutes: mins,
    isPreset: false,
    exercises: appState.newRoutineExercises
  };

  try {
    const res = await fetch(`${API_BASE}/routines`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      closeModal('modal-create-routine');
      loadRoutines();
      showToast('Đã tạo giáo án mới thành công!');
    }
  } catch (err) {
    console.error(err);
  }
}

// -------------------------------------------------------------
// EXERCISE PICKER MODAL
// -------------------------------------------------------------
function openAddExerciseToWorkoutModal() {
  appState.pickerTarget = 'liveWorkout';
  openModal('modal-exercise-picker');
  loadPickerExercises('');
}

function openPickerForNewRoutine() {
  appState.pickerTarget = 'newRoutine';
  openModal('modal-exercise-picker');
  loadPickerExercises('');
}

let pickerDebounceTimer;
function handlePickerSearch() {
  clearTimeout(pickerDebounceTimer);
  pickerDebounceTimer = setTimeout(() => {
    const query = document.getElementById('picker-search-input').value;
    loadPickerExercises(query);
  }, 250);
}

async function loadPickerExercises(query = '') {
  const container = document.getElementById('picker-exercise-list');
  if (!container) return;

  try {
    const res = await fetch(`${API_BASE}/exercises?size=15&search=${encodeURIComponent(query)}`);
    const data = await res.json();
    const list = data.content || [];

    container.innerHTML = list.map(ex => {
      const imgSrc = getExerciseImageUrl(ex.image);
      return `
      <div onclick="selectPickerExercise('${ex.id}')" style="display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); border-radius: var(--radius-sm); cursor: pointer; transition: background 0.2s;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <img src="${imgSrc}" alt="${ex.name}" style="width: 36px; height: 36px; border-radius: 4px; object-fit: contain; background: #0B0F17;" onerror="this.onerror=null; this.src='${FALLBACK_PLACEHOLDER_SVG}';">
          <div>
            <div style="font-weight: 700; color: #FFF; text-transform: capitalize; font-size: 0.9rem;">${ex.name}</div>
            <div style="font-size: 0.75rem; color: var(--text-dim);">${translateBodyPart(ex.bodyPart)} · ${ex.equipment}</div>
          </div>
        </div>
        <button class="filter-pill" style="padding: 4px 10px; font-size: 0.75rem;">+ Chọn</button>
      </div>
    `;
    }).join('');
  } catch (e) {
    console.error(e);
  }
}

async function selectPickerExercise(exerciseId) {
  try {
    const res = await fetch(`${API_BASE}/exercises/${exerciseId}`);
    const ex = await res.json();

    if (appState.pickerTarget === 'liveWorkout') {
      addExerciseToWorkoutSession(ex);
      closeModal('modal-exercise-picker');
      showToast(`Đã thêm "${ex.name}"!`);
    } else if (appState.pickerTarget === 'newRoutine') {
      appState.newRoutineExercises.push({
        exerciseId: ex.id,
        exerciseName: ex.name,
        bodyPart: ex.bodyPart,
        target: ex.target,
        equipment: ex.equipment,
        image: ex.image,
        gifUrl: ex.gifUrl,
        defaultSets: 3,
        targetReps: 10,
        restSeconds: 60
      });
      renderNewRoutineExercises();
      closeModal('modal-exercise-picker');
    }
  } catch (e) {
    console.error(e);
  }
}

// -------------------------------------------------------------
// ANALYTICS & MUSCLE HEATMAP
// -------------------------------------------------------------
async function loadAnalyticsData() {
  try {
    const [statsRes, historyRes] = await Promise.all([
      fetch(`${API_BASE}/workouts/stats`),
      fetch(`${API_BASE}/workouts/history`)
    ]);

    const stats = await statsRes.json();
    const history = await historyRes.json();

    // Render detailed muscle recovery cards
    const grid = document.getElementById('muscle-recovery-detailed-grid');
    if (grid && stats.muscleRecoveries) {
      grid.innerHTML = stats.muscleRecoveries.map(m => `
        <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 14px; display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: 700; color: #FFF; font-size: 1rem; text-transform: capitalize;">${translateBodyPart(m.bodyPart)}</span>
            <span class="muscle-recovery-badge" style="background: ${m.color}20; color: ${m.color}; border: 1px solid ${m.color}50;">
              ${m.recoveryPercentage}%
            </span>
          </div>
          <div style="width: 100%; height: 8px; background: var(--border-color); border-radius: var(--radius-full); overflow: hidden;">
            <div style="width: ${m.recoveryPercentage}%; height: 100%; background: ${m.color};"></div>
          </div>
          <div style="font-size: 0.78rem; color: var(--text-dim);">
            Trạng thái: <b style="color: ${m.color};">${m.status}</b>
          </div>
        </div>
      `).join('');
    }

    // Render Chart.js Volume Progress
    renderVolumeChart(stats.weeklyVolumes || []);

    // Render Full Workout History
    const historyContainer = document.getElementById('full-workout-history-list');
    if (historyContainer) {
      if (history.length === 0) {
        historyContainer.innerHTML = '<p style="color: var(--text-dim); text-align: center; padding: 20px;">Chưa có dữ liệu lịch sử.</p>';
      } else {
        historyContainer.innerHTML = history.map(log => `
          <div style="padding: 14px; background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); border-radius: var(--radius-md); margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <h4 style="color: #FFF; font-size: 1.1rem;">${log.routineName}</h4>
              <span style="font-size: 0.8rem; color: var(--text-dim);">${formatDateTime(log.loggedAt)}</span>
            </div>
            <div style="display: flex; gap: 16px; font-size: 0.85rem; color: var(--text-muted); flex-wrap: wrap;">
              <span>⏱️ Thời gian: <b>${formatDuration(log.durationSeconds)}</b></span>
              <span>🏋️ Volume: <b>${(log.totalVolumeKg || 0).toLocaleString()} kg</b></span>
              <span>🔢 Sets: <b>${log.totalSets}</b></span>
              <span>🔥 Reps: <b>${log.totalReps}</b></span>
              ${log.prCount > 0 ? `<span style="color: #F59E0B;">🏆 <b>${log.prCount} PR</b></span>` : ''}
            </div>
          </div>
        `).join('');
      }
    }

  } catch (e) {
    console.error(e);
  }
}

function renderVolumeChart(weeklyVolumes) {
  const ctx = document.getElementById('volumeChart');
  if (!ctx) return;

  if (appState.volumeChartInstance) {
    appState.volumeChartInstance.destroy();
  }

  const labels = weeklyVolumes.map(w => w.weekLabel);
  const data = weeklyVolumes.map(w => w.volumeKg);

  appState.volumeChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels.length > 0 ? labels : ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4 (Hiện tại)'],
      datasets: [{
        label: 'Khối lượng tạ tích lũy (kg)',
        data: data.length > 0 ? data : [12000, 14500, 16800, 19200],
        backgroundColor: 'rgba(249, 115, 22, 0.7)',
        borderColor: '#F97316',
        borderWidth: 2,
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.06)' },
          ticks: { color: '#94A3B8' }
        },
        x: {
          grid: { display: false },
          ticks: { color: '#94A3B8' }
        }
      },
      plugins: {
        legend: { labels: { color: '#F8FAFC' } }
      }
    }
  });
}

// -------------------------------------------------------------
// FITNESS CALCULATORS (1RM, TDEE, MACRO)
// -------------------------------------------------------------
async function calculate1RM() {
  const weight = parseFloat(document.getElementById('calc-1rm-weight').value) || 80;
  const reps = parseInt(document.getElementById('calc-1rm-reps').value) || 8;

  try {
    const res = await fetch(`${API_BASE}/calculator/1rm?weight=${weight}&reps=${reps}`);
    if (!res.ok) return;
    const data = await res.json();

    document.getElementById('calc-1rm-value').textContent = `${data.estimated1RM} kg`;

    const tableBody = document.getElementById('calc-1rm-table-body');
    if (tableBody && data.repPercentages) {
      tableBody.innerHTML = data.repPercentages.map(r => `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
          <td style="padding: 6px; text-align: left; color: #FFF;">${r.reps} Rep${r.reps > 1 ? 's' : ''}</td>
          <td style="padding: 6px; text-align: center; color: var(--primary); font-weight: 700;">${r.percentage}%</td>
          <td style="padding: 6px; text-align: right; color: #FFF; font-weight: 700;">${r.weightKg} kg</td>
        </tr>
      `).join('');
    }
  } catch (e) {
    console.error(e);
  }
}

async function calculateTDEE() {
  const gender = document.getElementById('calc-tdee-gender').value;
  const age = parseInt(document.getElementById('calc-tdee-age').value) || 25;
  const weight = parseFloat(document.getElementById('calc-tdee-weight').value) || 70;
  const height = parseFloat(document.getElementById('calc-tdee-height').value) || 175;
  const activity = document.getElementById('calc-tdee-activity').value;
  const goal = document.getElementById('calc-tdee-goal').value;

  try {
    const res = await fetch(`${API_BASE}/calculator/tdee?gender=${gender}&age=${age}&weight=${weight}&height=${height}&activity=${activity}&goal=${goal}`);
    if (!res.ok) return;
    const data = await res.json();

    document.getElementById('res-bmr').textContent = `${data.bmr.toLocaleString()} kcal`;
    document.getElementById('res-target-cal').textContent = `${data.targetCalories.toLocaleString()} kcal`;
    document.getElementById('res-protein').textContent = `${data.proteinGrams}g`;
    document.getElementById('res-carb').textContent = `${data.carbGrams}g`;
    document.getElementById('res-fat').textContent = `${data.fatGrams}g`;
  } catch (e) {
    console.error(e);
  }
}

// -------------------------------------------------------------
// UTILITIES & HELPERS
// -------------------------------------------------------------
function openModal(modalId) {
  const m = document.getElementById(modalId);
  if (m) {
    m.classList.add('active');
    initIcons();
  }
}

function closeModal(modalId) {
  const m = document.getElementById(modalId);
  if (m) m.classList.remove('active');
}

function showToast(message) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<i data-lucide="info" style="color: var(--primary);"></i> <span>${message}</span>`;
  container.appendChild(toast);
  initIcons();
  setTimeout(() => {
    toast.remove();
  }, 3500);
}

function triggerConfetti() {
  if (window.confetti) {
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 }
    });
  }
}

function translateBodyPart(part) {
  if (!part) return 'Toàn thân';
  const dict = {
    'chest': 'Ngực',
    'back': 'Lưng',
    'upper arms': 'Tay trước/sau',
    'lower arms': 'Cẳng tay',
    'shoulders': 'Vai',
    'upper legs': 'Đùi / Mông',
    'lower legs': 'Bắp chân',
    'waist': 'Cơ bụng / Eo',
    'cardio': 'Cardio / Tim mạch',
    'neck': 'Cổ'
  };
  return dict[part.toLowerCase()] || part;
}

function formatTimer(totalSecs) {
  const h = Math.floor(totalSecs / 3600).toString().padStart(2, '0');
  const m = Math.floor((totalSecs % 3600) / 60).toString().padStart(2, '0');
  const s = (totalSecs % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function formatDuration(totalSecs) {
  if (!totalSecs) return '0p';
  const m = Math.floor(totalSecs / 60);
  const s = totalSecs % 60;
  return m > 0 ? `${m} phút ${s}s` : `${s}s`;
}

function formatDateTime(dtStr) {
  if (!dtStr) return '';
  const d = new Date(dtStr);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}
