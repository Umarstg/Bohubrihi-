/**
 * Bohubrihi (বহুব্রীহি) - Room Management & Cleaning Attendance App
 * All data is securely persisted in localStorage with full offline capability.
 */

// Bengali Number Converter
const toBengaliNumber = (num) => {
    const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return String(num).replace(/[0-9]/g, (w) => bengaliDigits[+w]);
};

// Bengali Months & Days
const bengaliMonths = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];
const bengaliDays = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];

// Format JS Date into friendly Bengali string
function formatBengaliDate(dateObj, withDay = true) {
    const dayName = bengaliDays[dateObj.getDay()];
    const dateNum = toBengaliNumber(dateObj.getDate());
    const monthName = bengaliMonths[dateObj.getMonth()];
    const yearNum = toBengaliNumber(dateObj.getFullYear());

    if (withDay) {
        return `${dayName}, ${dateNum} ${monthName} ${yearNum}`;
    }
    return `${dateNum} ${monthName} ${yearNum}`;
}

// Initial Demo Data
const DEFAULT_DATA = {
    settings: {
        roomName: 'রুম ২০৪ (পদ্মা মেস)',
        finePerMiss: 30,
        startDate: '2026-11-01'
    },
    members: [
        { id: 'm1', name: 'সাকিব হাসান', phone: '01711000001', bed: 'উত্তর পাশে (বেড ১)' },
        { id: 'm2', name: 'তানভীর আহমেদ', phone: '01822000002', bed: 'দক্ষিণ পাশে (বেড ২)' },
        { id: 'm3', name: 'রাফিউল ইসলাম', phone: '01933000003', bed: 'জানালা সংলগ্ন (বেড ৩)' },
        { id: 'm4', name: 'ফাহিম চৌধুরী', phone: '01644000004', bed: 'দরজার পাশে (বেড ৪)' }
    ],
    attendanceLogs: {
        // 'YYYY-MM-DD': { memberId, memberName, completed: true/false, completedAt: 'time', note: '' }
    },
    notices: [
        {
            id: 'n1',
            title: 'শুক্রবার রুমের সার্বিক ডিপ-ক্লিনিং',
            body: 'আগামী শুক্রবার সকালে সবাই মিলে রুমের ফ্যান, জালনা এবং মেঝে সাবান পানি দিয়ে পরিষ্কার করা হবে। সবাই উপস্থিত থাকবেন।',
            author: 'রুম মনিটর',
            date: '১৬ নভেম্বর ২০২৬',
            isPinned: true
        },
        {
            id: 'n2',
            title: 'জুতা বাহিরে জুতার র্যাকে রাখার অনুরোধ',
            body: 'বৃষ্টির দিনে বা কাদার সময়ে রুমের ভিতরে জুতা নিয়ে ঢুকবেন না। দরজার সামনের র্যাকে জুতা রাখবেন।',
            author: 'তানভীর',
            date: '১৪ নভেম্বর ২০২৬',
            isPinned: false
        }
    ],
    fines: [
        {
            id: 'f1',
            memberId: 'm4',
            memberName: 'ফাহিম চৌধুরী',
            reason: 'রবিবার নির্ধারিত শিডিউলে ঝাড়ু না দেওয়া',
            amount: 30,
            date: '১৫ নভেম্বর ২০২৬',
            isPaid: false,
            paidDate: null
        },
        {
            id: 'f2',
            memberId: 'm1',
            memberName: 'সাকিব হাসান',
            reason: 'দেরিতে ময়লা ফেলা',
            amount: 20,
            date: '১০ নভেম্বর ২০২৬',
            isPaid: true,
            paidDate: '১২ নভেম্বর ২০২৬'
        }
    ]
};

// Application State
class BohubrihiApp {
    constructor() {
        this.storageKey = 'bohubrihi_room_data_v1';
        this.data = this.loadData();
        this.initDOM();
        this.bindEvents();
        this.renderAll();
    }

    loadData() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            if (raw) {
                const parsed = JSON.parse(raw);
                return { ...DEFAULT_DATA, ...parsed };
            }
        } catch (e) {
            console.error('Error loading data from localStorage', e);
        }
        return JSON.parse(JSON.stringify(DEFAULT_DATA));
    }

    saveData() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.data));
        } catch (e) {
            console.error('Failed to save data', e);
        }
    }

    // Get Today's Date String: YYYY-MM-DD
    getTodayString() {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Get cleaner assigned for a specific date string
    getAssignedCleanerForDate(dateStr) {
        if (!this.data.members || this.data.members.length === 0) return null;
        
        const targetDate = new Date(dateStr);
        const baseDate = new Date(this.data.settings.startDate || '2026-11-01');
        
        // Difference in calendar days
        const diffTime = targetDate - baseDate;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        const memberCount = this.data.members.length;
        const index = ((diffDays % memberCount) + memberCount) % memberCount;
        return this.data.members[index];
    }

    initDOM() {
        // UI Navigation
        this.navItems = document.querySelectorAll('.nav-item');
        this.tabContents = document.querySelectorAll('.tab-content');
        this.menuToggle = document.getElementById('menuToggle');
        this.sidebar = document.querySelector('.sidebar');
        
        // Badges & Headers
        this.noticeBadge = document.getElementById('noticeBadge');
        this.fineBadge = document.getElementById('fineBadge');
        this.roomNameDisplay = document.getElementById('roomNameDisplay');
        this.currentDateFormatted = document.getElementById('currentDateFormatted');

        // Sticky notice
        this.stickyPinnedNotice = document.getElementById('stickyPinnedNotice');
        this.pinnedTitle = document.getElementById('pinnedTitle');
        this.pinnedText = document.getElementById('pinnedText');
        this.closePinnedNoticeBtn = document.getElementById('closePinnedNotice');

        // Hero Cleaner Card Elements
        this.heroCleanerName = document.getElementById('heroCleanerName');
        this.heroAvatar = document.getElementById('heroAvatar');
        this.heroTaskDetail = document.getElementById('heroTaskDetail');
        this.todayStatusIndicator = document.getElementById('todayStatusIndicator');
        this.todayStatusText = document.getElementById('todayStatusText');
        this.toggleAttendanceBtn = document.getElementById('toggleAttendanceBtn');
        this.attendanceCheckCircle = document.getElementById('attendanceCheckCircle');
        this.attendanceActionTitle = document.getElementById('attendanceActionTitle');
        this.attendanceActionSub = document.getElementById('attendanceActionSub');
        this.completionMetaInfo = document.getElementById('completionMetaInfo');
        this.completedAtText = document.getElementById('completedAtText');

        // Dashboard widgets
        this.upcomingPreviewList = document.getElementById('upcomingPreviewList');
        this.fineSnapshotBody = document.getElementById('fineSnapshotBody');
        this.attendanceHistoryTable = document.getElementById('attendanceHistoryTable');

        // Schedule Tab
        this.userSelectorDropdown = document.getElementById('userSelectorDropdown');
        this.userNextTurnDate = document.getElementById('userNextTurnDate');
        this.userDaysLeft = document.getElementById('userDaysLeft');
        this.userMonthlyDatesList = document.getElementById('userMonthlyDatesList');
        this.scheduleMonthSelector = document.getElementById('scheduleMonthSelector');
        this.monthlyScheduleStatsBadge = document.getElementById('monthlyScheduleStatsBadge');
        this.monthlyScheduleTableTitle = document.getElementById('monthlyScheduleTableTitle');
        this.monthlyScheduleTableBody = document.getElementById('monthlyScheduleTableBody');
        this.genStartMemberSelect = document.getElementById('genStartMemberSelect');

        // Notices Tab
        this.noticesContainer = document.getElementById('noticesContainer');

        // Fines Tab
        this.totalUnpaidFines = document.getElementById('totalUnpaidFines');
        this.totalPaidFines = document.getElementById('totalPaidFines');
        this.membersWithDuesCount = document.getElementById('membersWithDuesCount');
        this.unpaidCountBadge = document.getElementById('unpaidCountBadge');
        this.unpaidFinesTable = document.getElementById('unpaidFinesTable');
        this.paidFinesTable = document.getElementById('paidFinesTable');

        // Members Tab
        this.membersCardContainer = document.getElementById('membersCardContainer');

        // Settings Tab
        this.settingRoomName = document.getElementById('settingRoomName');
        this.settingFineAmount = document.getElementById('settingFineAmount');
        this.settingSheetUrl = document.getElementById('settingSheetUrl');
        this.sheetStatusBadge = document.getElementById('sheetStatusBadge');

        // Toast
        this.toast = document.getElementById('toast');
        this.toastMessage = document.getElementById('toastMessage');
    }

    bindEvents() {
        // Tab switching
        this.navItems.forEach(item => {
            item.addEventListener('click', () => {
                const tab = item.dataset.tab;
                this.switchTab(tab);
                if (window.innerWidth <= 868) {
                    this.sidebar.classList.remove('open');
                }
            });
        });

        // Mobile drawer toggle
        if (this.menuToggle) {
            this.menuToggle.addEventListener('click', () => {
                this.sidebar.classList.toggle('open');
            });
        }

        // Attendance toggle click
        if (this.toggleAttendanceBtn) {
            this.toggleAttendanceBtn.addEventListener('click', () => {
                this.handleTodayAttendanceToggle();
            });
        }

        // Close sticky notice
        if (this.closePinnedNoticeBtn) {
            this.closePinnedNoticeBtn.addEventListener('click', () => {
                this.stickyPinnedNotice.classList.add('hidden');
            });
        }

        // User next turn dropdown
        if (this.userSelectorDropdown) {
            this.userSelectorDropdown.addEventListener('change', (e) => {
                this.calculateUserNextTurn(e.target.value);
            });
        }

        // Monthly schedule month selector
        if (this.scheduleMonthSelector) {
            this.scheduleMonthSelector.addEventListener('change', (e) => {
                this.currentScheduleMonth = e.target.value;
                this.renderMonthlySchedule(e.target.value);
            });
        }
    }

    switchTab(tabId) {
        this.navItems.forEach(nav => {
            nav.classList.toggle('active', nav.dataset.tab === tabId);
        });

        this.tabContents.forEach(content => {
            content.classList.toggle('active', content.id === `tab-${tabId}`);
        });

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    showToast(message, isSuccess = true) {
        if (!this.toast) return;
        this.toastMessage.textContent = message;
        this.toast.classList.add('show');
        setTimeout(() => {
            this.toast.classList.remove('show');
        }, 3000);
    }

    // ==========================================
    // RENDER FUNCTIONS
    // ==========================================

    renderAll() {
        this.renderHeaderAndBadges();
        this.renderTodayHero();
        this.renderUpcomingSchedule();
        this.renderAttendanceHistory();
        this.renderNotices();
        this.renderFines();
        this.renderMembers();
        this.renderSettingsValues();
    }

    renderHeaderAndBadges() {
        const now = new Date();
        if (this.currentDateFormatted) {
            this.currentDateFormatted.textContent = formatBengaliDate(now, true);
        }

        if (this.roomNameDisplay) {
            this.roomNameDisplay.textContent = this.data.settings.roomName || 'রুম ২০৪';
        }

        // Badges
        const unreadNoticesCount = this.data.notices.length;
        if (this.noticeBadge) {
            this.noticeBadge.textContent = toBengaliNumber(unreadNoticesCount);
        }

        const unpaidFines = this.data.fines.filter(f => !f.isPaid);
        if (this.fineBadge) {
            this.fineBadge.textContent = toBengaliNumber(unpaidFines.length);
        }
        if (this.unpaidCountBadge) {
            this.unpaidCountBadge.textContent = `${toBengaliNumber(unpaidFines.length)} টি বকেয়া`;
        }

        // Pinned Notice
        const pinned = this.data.notices.find(n => n.isPinned);
        if (pinned && this.stickyPinnedNotice) {
            this.stickyPinnedNotice.classList.remove('hidden');
            this.pinnedTitle.textContent = pinned.title;
            this.pinnedText.textContent = ` - ${pinned.body.slice(0, 80)}...`;
        } else if (this.stickyPinnedNotice) {
            this.stickyPinnedNotice.classList.add('hidden');
        }
    }

    renderTodayHero() {
        const todayStr = this.getTodayString();
        const cleaner = this.getAssignedCleanerForDate(todayStr);

        if (!cleaner) {
            this.heroCleanerName.textContent = 'কোনো সদস্য যোগ করা নেই';
            this.heroAvatar.textContent = '?';
            return;
        }

        this.heroCleanerName.textContent = cleaner.name;
        this.heroAvatar.textContent = cleaner.name.charAt(0);

        const log = this.data.attendanceLogs[todayStr];
        const isCompleted = log && log.completed;

        if (isCompleted) {
            this.toggleAttendanceBtn.classList.add('checked');
            this.attendanceActionTitle.textContent = 'আজকে রুম ঝাড়ু দেওয়া সম্পন্ন হয়েছে!';
            this.attendanceActionSub.textContent = 'হাজিরা নিশ্চিত করা হয়েছে (বাতিল করতে আবার ক্লিক করুন)';
            
            this.todayStatusIndicator.innerHTML = `
                <span class="status-dot completed"></span>
                <span class="status-text text-green">সম্পন্ন হয়েছে</span>
            `;
            this.completionMetaInfo.style.display = 'flex';
            this.completedAtText.textContent = log.completedAt 
                ? `হাজিরা লিপিবদ্ধ হয়েছে: ${log.completedAt}`
                : 'হাজিরা সম্পন্ন হয়েছে';
        } else {
            this.toggleAttendanceBtn.classList.remove('checked');
            this.attendanceActionTitle.textContent = 'রুম ঝাড়ু দেওয়া হয়েছে (হাজিরা টিক দিন)';
            this.attendanceActionSub.textContent = 'ক্লিক করে আজকের হাজিরা নিশ্চিত করুন';
            
            this.todayStatusIndicator.innerHTML = `
                <span class="status-dot pending"></span>
                <span class="status-text">এখনও ঝাড়ু দেওয়া হয়নি</span>
            `;
            this.completionMetaInfo.style.display = 'none';
        }
    }

    // Background Sync to Google Sheets
    syncToGoogleSheets(payload) {
        const url = this.data.settings.sheetUrl;
        if (!url) return;
        try {
            fetch(url, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }).then(() => {
                console.log('Google Sheets Sync Triggered:', payload.action);
            }).catch(err => {
                console.log('Google Sheets Sync Network note:', err);
            });
        } catch (e) {
            console.log('Google Sheets Sync caught:', e);
        }
    }

    handleTodayAttendanceToggle() {
        const todayStr = this.getTodayString();
        const cleaner = this.getAssignedCleanerForDate(todayStr);

        if (!cleaner) {
            this.showToast('দয়া করে প্রথমে সদস্য যুক্ত করুন');
            return;
        }

        const currentLog = this.data.attendanceLogs[todayStr];
        const isCompletedNow = currentLog && currentLog.completed;

        if (!isCompletedNow) {
            // Mark Completed
            const timeStr = new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });
            this.data.attendanceLogs[todayStr] = {
                memberId: cleaner.id,
                memberName: cleaner.name,
                completed: true,
                completedAt: `${timeStr}`
            };
            this.showToast(`ধন্যবাদ ${cleaner.name}! আজকের হাজিরা সফলভাবে টিক দেওয়া হয়েছে।`);

            // Sync to Google Sheets
            this.syncToGoogleSheets({
                action: 'markAttendance',
                date: todayStr,
                memberName: cleaner.name,
                completed: true,
                time: timeStr,
                note: 'অ্যাপ থেকে টিক দেওয়া হয়েছে'
            });
        } else {
            // Undo Completed
            delete this.data.attendanceLogs[todayStr];
            this.showToast('আজকের হাজিরা টিক বাতিল করা হয়েছে।');
        }

        this.saveData();
        this.renderTodayHero();
        this.renderAttendanceHistory();
        this.renderMembers();
    }

    renderUpcomingSchedule() {
        // Render 5 upcoming cleaners for widget
        if (this.upcomingPreviewList) {
            this.upcomingPreviewList.innerHTML = '';
            const today = new Date();

            for (let i = 1; i <= 4; i++) {
                const nextDate = new Date();
                nextDate.setDate(today.getDate() + i);

                const y = nextDate.getFullYear();
                const m = String(nextDate.getMonth() + 1).padStart(2, '0');
                const d = String(nextDate.getDate()).padStart(2, '0');
                const dateStr = `${y}-${m}-${d}`;

                const cleaner = this.getAssignedCleanerForDate(dateStr);
                if (!cleaner) continue;

                const daysLeftText = i === 1 ? 'আগামীকাল' : `${toBengaliNumber(i)} দিন পর`;
                const dateBengali = formatBengaliDate(nextDate, true);

                const item = document.createElement('div');
                item.className = 'upcoming-item';
                item.innerHTML = `
                    <div class="upcoming-user">
                        <div class="user-mini-avatar">${cleaner.name.charAt(0)}</div>
                        <div>
                            <div class="upcoming-name">${cleaner.name}</div>
                            <div class="upcoming-date">${dateBengali}</div>
                        </div>
                    </div>
                    <span class="days-badge">${daysLeftText}</span>
                `;
                this.upcomingPreviewList.appendChild(item);
            }
        }

        // Render Monthly Schedule Table
        this.renderMonthlySchedule(this.currentScheduleMonth || '11-2026');

        // Populate User Selector for "When is my next turn?"
        if (this.userSelectorDropdown) {
            const currentVal = this.userSelectorDropdown.value;
            this.userSelectorDropdown.innerHTML = '<option value="">-- আপনার নাম বেছে নিন --</option>';
            this.data.members.forEach(m => {
                const opt = document.createElement('option');
                opt.value = m.id;
                opt.textContent = m.name;
                if (m.id === currentVal) opt.selected = true;
                this.userSelectorDropdown.appendChild(opt);
            });
            if (currentVal) {
                this.calculateUserNextTurn(currentVal);
            }
        }

        // Populate Gen Member Modal Select
        if (this.genStartMemberSelect) {
            this.genStartMemberSelect.innerHTML = '';
            this.data.members.forEach(m => {
                const opt = document.createElement('option');
                opt.value = m.id;
                opt.textContent = m.name;
                this.genStartMemberSelect.appendChild(opt);
            });
        }
    }

    renderMonthlySchedule(monthKey = '11-2026') {
        this.currentScheduleMonth = monthKey;

        // Populate Month Selector if needed
        if (this.scheduleMonthSelector && this.scheduleMonthSelector.options.length === 0) {
            this.scheduleMonthSelector.innerHTML = `
                <option value="11-2026">নভেম্বর ২০২৬</option>
                <option value="12-2026">ডিসেম্বর ২০২৬</option>
                <option value="01-2027">জানুয়ারি ২০২৭</option>
                <option value="02-2027">ফেব্রুয়ারি ২০২৭</option>
            `;
            this.scheduleMonthSelector.value = monthKey;
        }

        const [monthNum, yearNum] = monthKey.split('-').map(Number);
        const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
        const monthName = bengaliMonths[monthNum - 1];

        if (this.monthlyScheduleTableTitle) {
            this.monthlyScheduleTableTitle.textContent = `${monthName} ${toBengaliNumber(yearNum)} মাসের ক্লিনিং তালিকা`;
        }

        if (this.monthlyScheduleStatsBadge) {
            this.monthlyScheduleStatsBadge.textContent = `মোট দিন: ${toBengaliNumber(daysInMonth)} টি`;
        }

        if (!this.monthlyScheduleTableBody) return;
        this.monthlyScheduleTableBody.innerHTML = '';

        const today = new Date();
        const todayStr = this.getTodayString();

        for (let d = 1; d <= daysInMonth; d++) {
            const dateObj = new Date(yearNum, monthNum - 1, d);
            const y = dateObj.getFullYear();
            const m = String(dateObj.getMonth() + 1).padStart(2, '0');
            const dayStr = String(d).padStart(2, '0');
            const dateStr = `${y}-${m}-${dayStr}`;

            const cleaner = this.getAssignedCleanerForDate(dateStr);
            if (!cleaner) continue;

            const isToday = dateStr === todayStr;
            const log = this.data.attendanceLogs[dateStr];
            const isCompleted = log && log.completed;
            const dayName = bengaliDays[dateObj.getDay()];

            const tr = document.createElement('tr');
            if (isToday) {
                tr.style.background = '#f0f9ff';
                tr.style.fontWeight = '500';
            }

            tr.innerHTML = `
                <td>
                    <strong>${toBengaliNumber(d)} ${monthName}</strong>
                    ${isToday ? '<span class="badge" style="background:#0284c7; color:white; margin-left:6px;">আজ</span>' : ''}
                </td>
                <td><span class="text-muted">${dayName}</span></td>
                <td>
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span class="user-mini-avatar" style="width:28px; height:28px; font-size:0.8rem;">${cleaner.name.charAt(0)}</span>
                        <strong>${cleaner.name}</strong>
                    </div>
                </td>
                <td>
                    ${isCompleted 
                        ? `<span class="badge" style="background:#dcfce7; color:#15803d;"><i class="fa-solid fa-check"></i> সম্পন্ন (${log.completedAt || 'হাজিরা'})</span>`
                        : (dateObj < new Date(today.getFullYear(), today.getMonth(), today.getDate()) 
                            ? `<span class="badge badge-warning"><i class="fa-solid fa-triangle-exclamation"></i> মিসড</span>`
                            : `<span class="badge" style="background:#f1f5f9; color:#475569;">আসন্ন</span>`)
                    }
                </td>
                <td>
                    <button class="btn btn-sm ${isCompleted ? 'btn-secondary' : 'btn-primary'}" 
                            style="padding:4px 10px; font-size:0.8rem; ${isCompleted ? '' : 'background:#10b981; border:none;'}"
                            onclick="app.toggleHistoryAttendance('${dateStr}', '${cleaner.id}', '${cleaner.name}')">
                        ${isCompleted ? 'আনচেক' : '<i class="fa-solid fa-check"></i> হাজিরা দিন'}
                    </button>
                </td>
            `;
            this.monthlyScheduleTableBody.appendChild(tr);
        }
    }

    calculateUserNextTurn(memberId) {
        if (!memberId) {
            this.userNextTurnDate.textContent = '-';
            this.userDaysLeft.textContent = '-';
            if (this.userMonthlyDatesList) this.userMonthlyDatesList.textContent = '';
            return;
        }

        const today = new Date();
        let foundDate = null;
        let daysAway = 0;
        const upcomingDatesThisMonth = [];

        // Search next 60 days
        for (let i = 0; i < 60; i++) {
            const checkDate = new Date();
            checkDate.setDate(today.getDate() + i);

            const y = checkDate.getFullYear();
            const m = String(checkDate.getMonth() + 1).padStart(2, '0');
            const d = String(checkDate.getDate()).padStart(2, '0');
            const dateStr = `${y}-${m}-${d}`;

            const cleaner = this.getAssignedCleanerForDate(dateStr);
            if (cleaner && cleaner.id === memberId) {
                if (!foundDate) {
                    foundDate = checkDate;
                    daysAway = i;
                }
                // If in this month
                if (checkDate.getMonth() === today.getMonth()) {
                    upcomingDatesThisMonth.push(toBengaliNumber(checkDate.getDate()));
                }
            }
        }

        if (foundDate) {
            this.userNextTurnDate.textContent = formatBengaliDate(foundDate, true);
            if (daysAway === 0) {
                this.userDaysLeft.textContent = 'আজ আপনার ঝাড়ু দেওয়ার পালা!';
            } else if (daysAway === 1) {
                this.userDaysLeft.textContent = 'আগামীকাল আপনার পালা!';
            } else {
                this.userDaysLeft.textContent = `আর ${toBengaliNumber(daysAway)} দিন বাকি`;
            }
        } else {
            this.userNextTurnDate.textContent = 'তালিকা পাওয়া যায়নি';
            this.userDaysLeft.textContent = '-';
        }

        if (this.userMonthlyDatesList) {
            if (upcomingDatesThisMonth.length > 0) {
                this.userMonthlyDatesList.innerHTML = `
                    <i class="fa-solid fa-calendar-check text-green"></i> 
                    চলতি মাসে আপনার মোট নির্ধারিত তারিখসমূহ: <strong>${upcomingDatesThisMonth.join(', ')} তারিখ</strong>
                `;
            } else {
                this.userMonthlyDatesList.textContent = 'চলতি মাসে আপনার কোনো পালা বাকি নেই।';
            }
        }
    }

    renderAttendanceHistory() {
        if (!this.attendanceHistoryTable) return;
        this.attendanceHistoryTable.innerHTML = '';

        const today = new Date();
        const rows = [];

        // Last 7 days
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(today.getDate() - i);

            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            const dateStr = `${y}-${m}-${d}`;

            const cleaner = this.getAssignedCleanerForDate(dateStr);
            if (!cleaner) continue;

            const log = this.data.attendanceLogs[dateStr];
            const isCompleted = log && log.completed;

            rows.push({
                dateStr,
                dateBengali: formatBengaliDate(date, true),
                cleanerName: cleaner.name,
                cleanerId: cleaner.id,
                isCompleted,
                completedAt: log ? (log.completedAt || 'রেকর্ডকৃত') : '-',
                isToday: i === 0
            });
        }

        rows.forEach(r => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${r.dateBengali}</strong> ${r.isToday ? '<span class="badge" style="background:#bae6fd;color:#0369a1;">আজ</span>' : ''}</td>
                <td>${r.cleanerName}</td>
                <td>
                    ${r.isCompleted 
                        ? '<span class="badge" style="background:#dcfce7; color:#15803d;"><i class="fa-solid fa-check"></i> সম্পন্ন</span>' 
                        : '<span class="badge badge-warning"><i class="fa-solid fa-clock"></i> বাকি</span>'}
                </td>
                <td>${r.completedAt}</td>
                <td>
                    <button class="btn btn-secondary btn-sm" style="padding:4px 8px;font-size:0.75rem;" onclick="app.toggleHistoryAttendance('${r.dateStr}', '${r.cleanerId}', '${r.cleanerName}')">
                        ${r.isCompleted ? 'আনচেক করুন' : 'হাজিরা দিন'}
                    </button>
                </td>
            `;
            this.attendanceHistoryTable.appendChild(tr);
        });
    }

    toggleHistoryAttendance(dateStr, cleanerId, cleanerName) {
        const log = this.data.attendanceLogs[dateStr];
        if (log && log.completed) {
            delete this.data.attendanceLogs[dateStr];
            this.showToast(`${dateStr}-এর হাজিরা বাতিল করা হয়েছে`);
        } else {
            this.data.attendanceLogs[dateStr] = {
                memberId: cleanerId,
                memberName: cleanerName,
                completed: true,
                completedAt: 'ম্যানুয়ালি আপডেট'
            };
            this.showToast(`${cleanerName}-এর হাজিরা সম্পন্ন হিসেবে রেকর্ড হয়েছে`);
        }
        this.saveData();
        this.renderAll();
    }

    renderNotices() {
        if (!this.noticesContainer) return;
        this.noticesContainer.innerHTML = '';

        if (this.data.notices.length === 0) {
            this.noticesContainer.innerHTML = `
                <div class="card" style="text-align:center; padding:40px; grid-column:1/-1;">
                    <i class="fa-regular fa-bell-slash text-muted" style="font-size:2rem; margin-bottom:10px;"></i>
                    <p class="text-muted">বর্তমানে কোনো নোটিশ নেই। নতুন কোনো নির্দেশনা থাকলে 'নতুন নোটিশ দিন' বাটনে ক্লিক করুন।</p>
                </div>
            `;
            return;
        }

        this.data.notices.forEach(notice => {
            const card = document.createElement('div');
            card.className = `notice-card ${notice.isPinned ? 'pinned' : ''}`;
            card.innerHTML = `
                <div>
                    <div class="notice-top">
                        <h4 class="notice-title">
                            ${notice.isPinned ? '<i class="fa-solid fa-thumbtack pin-icon"></i> ' : ''}${notice.title}
                        </h4>
                        <button class="notice-delete-btn" onclick="app.deleteNotice('${notice.id}')" title="নোটিশ মুছুন">
                            <i class="fa-regular fa-trash-can"></i>
                        </button>
                    </div>
                    <div class="notice-body">${notice.body}</div>
                </div>
                <div class="notice-meta">
                    <span><i class="fa-regular fa-user"></i> ${notice.author || 'সদস্য'}</span>
                    <span><i class="fa-regular fa-calendar"></i> ${notice.date}</span>
                </div>
            `;
            this.noticesContainer.appendChild(card);
        });
    }

    deleteNotice(id) {
        if (confirm('আপনি কি এই নোটিশটি মুছে ফেলতে চান?')) {
            this.data.notices = this.data.notices.filter(n => n.id !== id);
            this.saveData();
            this.renderAll();
            this.showToast('নোটিশটি মুছে ফেলা হয়েছে');
        }
    }

    renderFines() {
        const unpaidFines = this.data.fines.filter(f => !f.isPaid);
        const paidFines = this.data.fines.filter(f => f.isPaid);

        // Sum calculations
        const totalUnpaid = unpaidFines.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
        const totalPaid = paidFines.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

        // Members with unpaid dues
        const membersWithDues = new Set(unpaidFines.map(f => f.memberId));

        if (this.totalUnpaidFines) this.totalUnpaidFines.textContent = `৳${toBengaliNumber(totalUnpaid)}`;
        if (this.totalPaidFines) this.totalPaidFines.textContent = `৳${toBengaliNumber(totalPaid)}`;
        if (this.membersWithDuesCount) this.membersWithDuesCount.textContent = `${toBengaliNumber(membersWithDues.size)} জন`;

        // Dashboard fine snapshot widget
        if (this.fineSnapshotBody) {
            this.fineSnapshotBody.innerHTML = `
                <div class="fine-snapshot-stat">
                    <span>মোট বকেয়া জরিমানা:</span>
                    <strong class="text-warning">৳${toBengaliNumber(totalUnpaid)}</strong>
                </div>
                <div class="fine-snapshot-stat" style="background:#f0fdf4; border-left-color:#10b981;">
                    <span>আদায়কৃত রুম ফান্ড:</span>
                    <strong class="text-green">৳${toBengaliNumber(totalPaid)}</strong>
                </div>
            `;

            if (unpaidFines.length > 0) {
                const subTitle = document.createElement('div');
                subTitle.className = 'text-muted';
                subTitle.style.marginTop = '6px';
                subTitle.textContent = 'সর্বশেষ বকেয়া:';
                this.fineSnapshotBody.appendChild(subTitle);

                unpaidFines.slice(0, 3).forEach(f => {
                    const row = document.createElement('div');
                    row.className = 'snapshot-unpaid-item';
                    row.innerHTML = `
                        <span>${f.memberName}</span>
                        <strong class="text-warning">৳${toBengaliNumber(f.amount)}</strong>
                    `;
                    this.fineSnapshotBody.appendChild(row);
                });
            }
        }

        // Unpaid Fines Table
        if (this.unpaidFinesTable) {
            this.unpaidFinesTable.innerHTML = '';
            if (unpaidFines.length === 0) {
                this.unpaidFinesTable.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align:center; padding:24px; color:#10b981;">
                            <i class="fa-solid fa-circle-check" style="font-size:1.4rem;"></i><br>
                            দারুণ! বর্তমানে কোনো সদস্যের জরিমানা বকেয়া নেই।
                        </td>
                    </tr>
                `;
            } else {
                unpaidFines.forEach(fine => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td><strong>${fine.memberName}</strong></td>
                        <td>${fine.date}</td>
                        <td>${fine.reason}</td>
                        <td><strong class="text-warning">৳${toBengaliNumber(fine.amount)}</strong></td>
                        <td>
                            <button class="btn btn-primary btn-sm" style="padding:4px 10px; font-size:0.8rem; background:#10b981; border:none;" onclick="app.markFineAsPaid('${fine.id}')">
                                <i class="fa-solid fa-check"></i> জরিমানা আদায় হয়েছে
                            </button>
                        </td>
                        <td>
                            <button class="notice-delete-btn" onclick="app.deleteFine('${fine.id}')" title="মুছুন">
                                <i class="fa-regular fa-trash-can"></i>
                            </button>
                        </td>
                    `;
                    this.unpaidFinesTable.appendChild(tr);
                });
            }
        }

        // Paid Fines Table
        if (this.paidFinesTable) {
            this.paidFinesTable.innerHTML = '';
            if (paidFines.length === 0) {
                this.paidFinesTable.innerHTML = `
                    <tr>
                        <td colspan="5" style="text-align:center; padding:18px; color:var(--slate-400);">
                            এখনও পর্যন্ত কোনো জরিমানা আদায়ের হিস্ট্রি নেই।
                        </td>
                    </tr>
                `;
            } else {
                paidFines.forEach(fine => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td><strong>${fine.memberName}</strong></td>
                        <td>${fine.paidDate || fine.date}</td>
                        <td>${fine.reason}</td>
                        <td><strong class="text-green">৳${toBengaliNumber(fine.amount)}</strong></td>
                        <td><span class="badge" style="background:#dcfce7; color:#15803d;"><i class="fa-solid fa-check-double"></i> পরিশোধিত</span></td>
                    `;
                    this.paidFinesTable.appendChild(tr);
                });
            }
        }
    }

    markFineAsPaid(fineId) {
        const fine = this.data.fines.find(f => f.id === fineId);
        if (fine) {
            fine.isPaid = true;
            fine.paidDate = formatBengaliDate(new Date(), false);
            this.saveData();
            this.renderAll();
            this.showToast(`৳${fine.amount} জরিমানা পরিশোধ হয়েছে হিসেবে চিহ্নিত করা হলো!`);

            // Sync to Google Sheets
            this.syncToGoogleSheets({
                action: 'payFine',
                id: fineId,
                paidDate: fine.paidDate
            });
        }
    }

    deleteFine(fineId) {
        if (confirm('আপনি কি এই জরিমানার এন্ট্রিটি মুছে ফেলতে চান?')) {
            this.data.fines = this.data.fines.filter(f => f.id !== fineId);
            this.saveData();
            this.renderAll();
            this.showToast('জরিমানার এন্ট্রি মুছে ফেলা হয়েছে');
        }
    }

    renderMembers() {
        if (!this.membersCardContainer) return;
        this.membersCardContainer.innerHTML = '';

        // Update Fine Member Modal Select Dropdown
        const fineMemberSelect = document.getElementById('newFineMemberSelect');
        if (fineMemberSelect) {
            fineMemberSelect.innerHTML = '';
            this.data.members.forEach(m => {
                const opt = document.createElement('option');
                opt.value = m.id;
                opt.textContent = m.name;
                fineMemberSelect.appendChild(opt);
            });
        }

        this.data.members.forEach(m => {
            // Count total cleaning done
            let totalCleanedCount = 0;
            Object.values(this.data.attendanceLogs).forEach(log => {
                if (log.memberId === m.id && log.completed) {
                    totalCleanedCount++;
                }
            });

            // Calculate unpaid fine for this member
            const memberUnpaidFines = this.data.fines
                .filter(f => f.memberId === m.id && !f.isPaid)
                .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

            const card = document.createElement('div');
            card.className = 'member-card';
            card.innerHTML = `
                <button class="member-del-btn" onclick="app.deleteMember('${m.id}')" title="সদস্য সরান">
                    <i class="fa-solid fa-xmark"></i>
                </button>
                <div class="member-avatar">${m.name.charAt(0)}</div>
                <h4 class="member-name">${m.name}</h4>
                <p class="member-phone"><i class="fa-solid fa-bed"></i> ${m.bed || 'রুমমেট'}</p>
                <p class="member-phone"><i class="fa-solid fa-phone"></i> ${m.phone || 'নম্বর নেই'}</p>
                
                <div class="member-stats">
                    <div>
                        <span class="text-muted">মোট ঝাড়ু</span>
                        <strong>${toBengaliNumber(totalCleanedCount)} বার</strong>
                    </div>
                    <div>
                        <span class="text-muted">বকেয়া জরিমানা</span>
                        <strong class="${memberUnpaidFines > 0 ? 'text-warning' : 'text-green'}">
                            ৳${toBengaliNumber(memberUnpaidFines)}
                        </strong>
                    </div>
                </div>
            `;
            this.membersCardContainer.appendChild(card);
        });
    }

    deleteMember(memberId) {
        if (this.data.members.length <= 1) {
            alert('কমপক্ষে একজন সদস্য থাকতে হবে!');
            return;
        }
        if (confirm('আপনি কি এই সদস্যকে তালিকা থেকে বাদ দিতে চান?')) {
            this.data.members = this.data.members.filter(m => m.id !== memberId);
            this.saveData();
            this.renderAll();
            this.showToast('সদস্য মুছে ফেলা হয়েছে');
        }
    }

    renderSettingsValues() {
        if (this.settingRoomName) {
            this.settingRoomName.value = this.data.settings.roomName || '';
        }
        if (this.settingFineAmount) {
            this.settingFineAmount.value = this.data.settings.finePerMiss || 30;
        }
        if (this.settingSheetUrl) {
            this.settingSheetUrl.value = this.data.settings.sheetUrl || '';
        }
        if (this.sheetStatusBadge) {
            if (this.data.settings.sheetUrl) {
                this.sheetStatusBadge.innerHTML = '<i class="fa-solid fa-circle-check"></i> শিট সংযুক্ত আছে';
                this.sheetStatusBadge.style.background = '#dcfce7';
                this.sheetStatusBadge.style.color = '#15803d';
            } else {
                this.sheetStatusBadge.textContent = 'লোকাল মোড';
                this.sheetStatusBadge.style.background = '#e0f2fe';
                this.sheetStatusBadge.style.color = '#0369a1';
            }
        }
    }
}

// Service Worker Registration for Offline & PWA Install
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW registration error:', err));
    });
}

// Global App Instance
let app;
window.addEventListener('DOMContentLoaded', () => {
    app = new BohubrihiApp();
});

// Helper for UI Tab Switching from buttons
function switchTab(tabId) {
    if (app) app.switchTab(tabId);
}

// Modal Handlers
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
}

// Submit Handlers
function submitNewNotice() {
    const title = document.getElementById('newNoticeTitle').value.trim();
    const body = document.getElementById('newNoticeBody').value.trim();
    const author = document.getElementById('newNoticeAuthor').value.trim() || 'রুমমেট';
    const isPinned = document.getElementById('newNoticePinned').checked;

    if (!title || !body) {
        alert('দয়া করে নোটিশের শিরোনাম ও বিবরণ লিখুন।');
        return;
    }

    const newNotice = {
        id: 'n_' + Date.now(),
        title,
        body,
        author,
        date: formatBengaliDate(new Date(), false),
        isPinned
    };

    app.data.notices.unshift(newNotice);
    app.saveData();
    app.renderAll();
    closeModal('modal-add-notice');

    // Sync to Google Sheets
    app.syncToGoogleSheets({
        action: 'addNotice',
        ...newNotice
    });

    // Reset Form
    document.getElementById('newNoticeTitle').value = '';
    document.getElementById('newNoticeBody').value = '';
    document.getElementById('newNoticePinned').checked = false;

    app.showToast('নতুন নোটিশ প্রকাশিত হয়েছে!');
}

function submitNewFine() {
    const memberSelect = document.getElementById('newFineMemberSelect');
    const memberId = memberSelect.value;
    const memberName = memberSelect.options[memberSelect.selectedIndex]?.text || 'সদস্য';
    const reason = document.getElementById('newFineReason').value.trim();
    const amount = Number(document.getElementById('newFineAmount').value) || 30;
    const dateInput = document.getElementById('newFineDate').value;

    if (!reason) {
        alert('দয়া করে জরিমানার কারণ লিখুন।');
        return;
    }

    let formattedDate = formatBengaliDate(new Date(), false);
    if (dateInput) {
        formattedDate = formatBengaliDate(new Date(dateInput), false);
    }

    const newFine = {
        id: 'f_' + Date.now(),
        memberId,
        memberName,
        reason,
        amount,
        date: formattedDate,
        isPaid: false,
        paidDate: null
    };

    app.data.fines.unshift(newFine);
    app.saveData();
    app.renderAll();
    closeModal('modal-add-fine');

    // Sync to Google Sheets
    app.syncToGoogleSheets({
        action: 'addFine',
        ...newFine
    });

    // Reset
    document.getElementById('newFineReason').value = '';
    app.showToast(`${memberName}-এর একাউন্টে ৳${amount} জরিমানা যোগ করা হয়েছে`);
}

function saveGoogleSheetSettings() {
    const url = document.getElementById('settingSheetUrl').value.trim();
    app.data.settings.sheetUrl = url;
    app.saveData();
    app.renderSettingsValues();
    if (url) {
        app.showToast('গুগল শিট সফলভাবে যুক্ত হয়েছে!');
    } else {
        app.showToast('গুগল শিট সংযোগ বিচ্ছিন্ন করা হয়েছে');
    }
}

function submitNewMember() {
    const name = document.getElementById('newMemberName').value.trim();
    const phone = document.getElementById('newMemberPhone').value.trim();
    const bed = document.getElementById('newMemberBed').value.trim();

    if (!name) {
        alert('দয়া করে সদস্যের পুরো নাম লিখুন।');
        return;
    }

    const newMember = {
        id: 'm_' + Date.now(),
        name,
        phone,
        bed
    };

    app.data.members.push(newMember);
    app.saveData();
    app.renderAll();
    closeModal('modal-add-member');

    // Reset
    document.getElementById('newMemberName').value = '';
    document.getElementById('newMemberPhone').value = '';
    document.getElementById('newMemberBed').value = '';

    app.showToast(`নতুন সদস্য "${name}" সফলভাবে যুক্ত করা হয়েছে!`);
}

function saveGeneralSettings() {
    const roomName = document.getElementById('settingRoomName').value.trim();
    const fineAmount = Number(document.getElementById('settingFineAmount').value) || 30;

    app.data.settings.roomName = roomName || 'রুম ২০৪';
    app.data.settings.finePerMiss = fineAmount;

    app.saveData();
    app.renderAll();
    app.showToast('সেটিংস সফলভাবে সংরক্ষিত হয়েছে!');
}

// Backup & Export JSON
function exportAppData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(app.data, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `bohubrihi_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    app.showToast('ডাটা ব্যাকআপ ফাইল ডাউনলোড সম্পন্ন!');
}

function importAppData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            if (imported.members && imported.settings) {
                app.data = imported;
                app.saveData();
                app.renderAll();
                app.showToast('ডাটা সফলভাবে রিস্টোর হয়েছে!');
            } else {
                alert('সঠিক ব্যাকআপ ফাইল নির্বাচন করুন।');
            }
        } catch (err) {
            alert('ফাইল পড়তে সমস্যা হয়েছে: ' + err.message);
        }
    };
    reader.readAsText(file);
}

function submitGenerateMonth() {
    const monthKey = document.getElementById('genMonthInput').value;
    const startMemberId = document.getElementById('genStartMemberSelect').value;
    const autoSync = document.getElementById('genAutoSyncSheet').checked;

    // Set rotation base date to the 1st of selected month
    const [m, y] = monthKey.split('-').map(Number);
    const startDateStr = `${y}-${String(m).padStart(2, '0')}-01`;

    // Reorder members so selected member is first
    const memberIndex = app.data.members.findIndex(mem => mem.id === startMemberId);
    if (memberIndex > 0) {
        const selected = app.data.members.splice(memberIndex, 1)[0];
        app.data.members.unshift(selected);
    }

    app.data.settings.startDate = startDateStr;
    app.currentScheduleMonth = monthKey;
    if (app.scheduleMonthSelector) {
        app.scheduleMonthSelector.value = monthKey;
    }

    app.saveData();
    app.renderAll();
    closeModal('modal-generate-month');

    app.showToast('নতুন মাসের ক্লিনিং শিডিউল সফলভাবে তৈরি হয়েছে!');

    if (autoSync) {
        syncCurrentMonthToSheets();
    }
}

function syncCurrentMonthToSheets() {
    const monthKey = app.currentScheduleMonth || '11-2026';
    const [monthNum, yearNum] = monthKey.split('-').map(Number);
    const daysInMonth = new Date(yearNum, monthNum, 0).getDate();

    const scheduleRows = [];

    for (let d = 1; d <= daysInMonth; d++) {
        const dateObj = new Date(yearNum, monthNum - 1, d);
        const y = dateObj.getFullYear();
        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dayStr = String(d).padStart(2, '0');
        const dateStr = `${y}-${m}-${dayStr}`;

        const cleaner = app.getAssignedCleanerForDate(dateStr);
        if (!cleaner) continue;

        const log = app.data.attendanceLogs[dateStr];
        const isCompleted = log && log.completed;

        scheduleRows.push({
            date: dateStr,
            dayName: bengaliDays[dateObj.getDay()],
            memberName: cleaner.name,
            status: isCompleted ? 'সম্পন্ন (Cleaned)' : 'বাকি (Pending)',
            time: log ? log.completedAt : ''
        });
    }

    app.syncToGoogleSheets({
        action: 'syncMonthlySchedule',
        schedule: scheduleRows
    });

    app.showToast('নতুন মাসের শিডিউল গুগল শিটে পাঠানো হয়েছে!');
}

function resetToDemoData() {
    if (confirm('আপনি কি সকল ডাটা মুছে ডেমো ডাটায় ফিরে যেতে চান? আপনার পূর্বের সব রেকর্ড মুছে যাবে!')) {
        app.data = JSON.parse(JSON.stringify(DEFAULT_DATA));
        app.saveData();
        app.renderAll();
        app.showToast('অ্যাপ প্রাথমিক ডেমো ডাটায় রিসেট হয়েছে।');
    }
}
