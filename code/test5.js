function escapeHTML(str) {
  if (!str) return "";
  return str.toString().replace(
    /[&<>'"]/g,
    (tag) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;",
      })[tag],
  );
}

function pad(n) {
  return n < 10 ? "0" + n : "" + n;
}

function formatDateKey(d) {
  return (
    d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate())
  );
}

function addDaysKey(base, n) {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return formatDateKey(d);
}

function formatDateChip(dateKey, time, repeat) {
  if (repeat === "weekly") return "🔄 Hằng tuần";
  const d = new Date(dateKey + "T00:00:00");
  let s = d.getDate() + "/" + (d.getMonth() + 1);
  if (time) s += " · " + time;
  return s;
}

const todayDate = new Date();
const todayKey = formatDateKey(todayDate);

let todos = [];
let notes = [];
let todoSeq = 1;
let noteSeq = 1;
let currentUser = null;

function initMockData() {
  todos = [
    {
      id: 1,
      title: "Làm bài tập Giải tích 2",
      tag: "hoctap",
      done: false,
      date: todayKey,
      time: "14:00",
      repeat: "none",
    },
    {
      id: 2,
      title: "Họp CLB",
      tag: "canhan",
      done: false,
      date: todayKey,
      time: "20:00",
      repeat: "weekly",
      doneDates: [],
    },
    {
      id: 3,
      title: "Mua đồ dùng cá nhân",
      tag: "vat",
      done: false,
      date: todayKey,
      time: null,
      repeat: "none",
    },
    {
      id: 4,
      title: "Nộp báo cáo",
      tag: "hoctap",
      done: true,
      date: addDaysKey(todayDate, -1),
      time: null,
      repeat: "none",
    },
  ];
  notes = [
    {
      id: 1,
      title: "Ý tưởng dự án",
      body: "Ứng dụng quản lý thời gian",
      color: "note-c4",
      reminderText: null,
      reminderRaw: null,
    },
    {
      id: 2,
      title: "Đóng tiền điện",
      body: "Nhớ nộp tiền phòng.",
      color: "note-c1",
      reminderText: "Ngày mai · 20:00",
      reminderRaw: addDaysKey(todayDate, 1) + "T20:00",
    },
  ];
  todoSeq = 5;
  noteSeq = 3;
  saveData();
}

function loadData() {
  const storedUser = localStorage.getItem("sotay_user");
  if (storedUser) currentUser = storedUser;

  const storedTodos = localStorage.getItem("sotay_todos");
  const storedNotes = localStorage.getItem("sotay_notes");

  if (storedTodos && storedNotes) {
    todos = JSON.parse(storedTodos);
    notes = JSON.parse(storedNotes);
    todoSeq = parseInt(localStorage.getItem("sotay_todoSeq")) || 1;
    noteSeq = parseInt(localStorage.getItem("sotay_noteSeq")) || 1;
  } else {
    initMockData();
  }
}

function saveData() {
  localStorage.setItem("sotay_todos", JSON.stringify(todos));
  localStorage.setItem("sotay_notes", JSON.stringify(notes));
  localStorage.setItem("sotay_todoSeq", todoSeq);
  localStorage.setItem("sotay_noteSeq", noteSeq);
}

function updateApp() {
  saveData();
  renderUpcoming();
  renderTodos();
  renderCalendar();
  renderHome();
  updateProgress();
}

/* PROGRESS BAR LOGIC */
function updateProgress() {
  const todayTasks = tasksForDate(todayKey);
  const totalTasks = todayTasks.length;
  const completedTasks = todayTasks.filter((t) =>
    isTaskDoneOnDate(t, todayKey),
  ).length;

  const percentage =
    totalTasks === 0
      ? 0
      : Math.round((completedTasks / totalTasks) * 100);

  const progressFill = document.getElementById("progressFill");
  const progressText = document.getElementById("progressText");

  if (progressFill && progressText) {
    progressFill.style.width = percentage + "%";
    if (totalTasks === 0) {
      progressText.textContent = "Chưa có việc nào";
      progressFill.style.width = "0%";
    } else if (percentage === 100) {
      progressText.textContent = "Tuyệt vời! Đã xong hết 🚀";
      progressFill.style.background = "var(--sage)";
    } else {
      progressText.textContent = `${completedTasks}/${totalTasks} hoàn thành (${percentage}%)`;
      progressFill.style.background = "var(--amber)";
    }
  }
}

function switchAuth(mode) {
  document
    .getElementById("tabLogin")
    .classList.toggle("active", mode === "login");
  document
    .getElementById("tabRegister")
    .classList.toggle("active", mode === "register");
  document.getElementById("formLogin").style.display =
    mode === "login" ? "block" : "none";
  document.getElementById("formRegister").style.display =
    mode === "register" ? "block" : "none";
}

function doLogin(e) {
  e.preventDefault();
  currentUser = document.querySelector(
    e.target.id === "formLogin"
      ? '#formLogin input[type="text"]'
      : '#formRegister input[type="email"]',
  ).value;
  localStorage.setItem("sotay_user", currentUser);
  startApp();
  return false;
}

function doLogout() {
  localStorage.removeItem("sotay_user");
  currentUser = null;
  document.getElementById("app").classList.remove("on");
  document.getElementById("screen-auth").style.display = "grid";
}

// mở đóng sidebar khi di chuột
function expandSidebar() {
  if (window.innerWidth > 680) {
    document.getElementById("app").classList.add("sidebar-expanded");
  }
}

function collapseSidebar() {
  if (window.innerWidth > 680) {
    document.getElementById("app").classList.remove("sidebar-expanded");
  }
}

function startApp() {
  document.getElementById("screen-auth").style.display = "none";
  document.getElementById("app").classList.add("on");

  switchView("home");
  updateApp();
  renderNotes();
}

function switchView(name) {
  document
    .querySelectorAll(".tab-btn")
    .forEach((b) =>
      b.classList.toggle("active", b.dataset.view === name),
    );
  document
    .querySelectorAll(".view")
    .forEach((v) =>
      v.classList.toggle("active", v.id === "view-" + name),
    );
}

function toggleBell() {
  document.getElementById("bellPanel").classList.toggle("open");
}

document.addEventListener("click", function (e) {
  const w = document.querySelector(".bell-wrap");
  if (w && !w.contains(e.target))
    document.getElementById("bellPanel").classList.remove("open");
});

const tagLabel = {
  hoctap: "Học tập",
  canhan: "Cá nhân",
  vat: "Việc vặt",
};

function addTodo() {
  const input = document.getElementById("todoInput");
  const title = input.value.trim();
  if (!title) return;

  todos.unshift({
    id: todoSeq++,
    title,
    tag: document.getElementById("todoTag").value,
    done: false,
    date: null,
    time: null,
    repeat: "none",
  });
  input.value = "";
  updateApp();
}

document.getElementById("todoInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") addTodo();
});

function toggleTodo(id) {
  const t = todos.find((x) => x.id === id);
  if (t) {
    t.done = !t.done;
    updateApp();
  }
}

function deleteTodo(id) {
  todos = todos.filter((x) => x.id !== id);
  updateApp();
}

function todoItemHtml(t) {
  const safeTitle = escapeHTML(t.title);
  const isWeekly = t.repeat === "weekly";
  const doneClass = t.done && !isWeekly ? "done" : "";
  const checkedClass = t.done && !isWeekly ? "checked" : "";

  return `
    <li class="todo-item ${doneClass}">
<button class="todo-check ${checkedClass}" onclick="${isWeekly ? "" : `toggleTodo(${t.id})`}" ${isWeekly ? 'style="opacity:0.4; cursor:default;" title="Vào Lịch để check việc hằng tuần"' : ""}>
  <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><path d="M5 13l4 4L19 7"/></svg>
</button>
<div class="todo-body">
  <div class="todo-title">${safeTitle}</div>
  <div class="todo-meta">
    <span class="tag ${t.tag}">${tagLabel[t.tag]}</span>
    ${t.date ? `<span class="tag datechip ${isWeekly ? "repeat" : ""}">${isWeekly ? "🔄 " : "📅 "}${formatDateChip(t.date, t.time, t.repeat)}</span>` : ""}
  </div>
</div>
<button class="todo-del" onclick="deleteTodo(${t.id})" title="Xoá">
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>
</button>
    </li>`;
}

function renderTodos() {
  const pending = todos.filter((t) => !t.done || t.repeat === "weekly");
  const done = todos.filter((t) => t.done && t.repeat !== "weekly");

  document.getElementById("countPending").textContent = pending.length;
  document.getElementById("countDone").textContent = done.length;

  document.getElementById("listPending").innerHTML = pending.length
    ? pending.map(todoItemHtml).join("")
    : '<div class="empty-note">Không còn việc nào đang chờ — thêm việc mới ở trên.</div>';
  document.getElementById("listDone").innerHTML = done.length
    ? done.map(todoItemHtml).join("")
    : '<div class="empty-note">Chưa có việc nào hoàn thành.</div>';
}

/* ---------- CALENDAR LOGIC ---------- */
let calCursor = new Date(
  todayDate.getFullYear(),
  todayDate.getMonth(),
  1,
);
let selectedDateKey = todayKey;

const monthNames = [
  "Tháng 1",
  "Tháng 2",
  "Tháng 3",
  "Tháng 4",
  "Tháng 5",
  "Tháng 6",
  "Tháng 7",
  "Tháng 8",
  "Tháng 9",
  "Tháng 10",
  "Tháng 11",
  "Tháng 12",
];
const weekdayNamesFull = [
  "Chủ nhật",
  "Thứ hai",
  "Thứ ba",
  "Thứ tư",
  "Thứ năm",
  "Thứ sáu",
  "Thứ bảy",
];

function monthShift(n) {
  calCursor = new Date(
    calCursor.getFullYear(),
    calCursor.getMonth() + n,
    1,
  );
  renderCalendar();
}

function goToday() {
  calCursor = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1);
  selectedDateKey = todayKey;
  renderCalendar();
}

function selectDay(key) {
  if (!key) return;
  selectedDateKey = key;
  renderCalendar();
}

function tasksForDate(key) {
  const targetDate = new Date(key + "T00:00:00");
  const targetTime = targetDate.getTime();
  const targetDayOfWeek = targetDate.getDay();

  return todos
    .filter((t) => {
      if (!t.date) return false;
      if (t.date === key) return true;
      if (t.repeat === "weekly") {
        const startDate = new Date(t.date + "T00:00:00");
        if (
          startDate.getTime() <= targetTime &&
          startDate.getDay() === targetDayOfWeek
        ) {
          return true;
        }
      }
      return false;
    })
    .sort((a, b) => (a.time || "99:99").localeCompare(b.time || "99:99"));
}

function renderCalendar() {
  const label = document.getElementById("calMonthLabel");
  if (!label) return;

  label.textContent =
    monthNames[calCursor.getMonth()] + ", " + calCursor.getFullYear();
  const year = calCursor.getFullYear(),
    month = calCursor.getMonth();
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  let cells = [];
  for (let i = firstDow - 1; i >= 0; i--)
    cells.push({ day: daysInPrevMonth - i, outside: true, key: null });
  for (let d = 1; d <= daysInMonth; d++)
    cells.push({
      day: d,
      outside: false,
      key: year + "-" + pad(month + 1) + "-" + pad(d),
    });
  while (cells.length % 7 !== 0)
    cells.push({
      day: cells.length - (firstDow + daysInMonth) + 1,
      outside: true,
      key: null,
    });

  document.getElementById("calGrid").innerHTML = cells
    .map((c) => {
      if (c.outside)
        return `<div class="cal-cell outside"><div class="cal-daynum">${c.day}</div></div>`;

      const dayTasks = tasksForDate(c.key);
      const isPast = c.key < todayKey;
      const isToday = c.key === todayKey;
      const isSelected = c.key === selectedDateKey;
      const showDots = !(isPast && !isToday); // Ngày đã qua thì không hiện chấm việc nữa
      const dots = dayTasks
        .slice(0, 3)
        .map(() => '<span class="cal-dot"></span>')
        .join("");
      const more =
        dayTasks.length > 3
          ? `<div class="cal-more">+${dayTasks.length - 3}</div>`
          : "";

      let classes = "cal-cell";
      if (isToday) classes += " today";
      if (isSelected) classes += " selected";
      if (isPast && !isToday) classes += " past"; // Thêm class past cho các ngày đã qua

      return `<div class="${classes}" onclick="selectDay('${c.key}')">
<div class="cal-daynum">${c.day}</div>
${dayTasks.length && showDots ? `<div class="cal-dots">${dots}</div>${more}` : ""}
    </div>`;
    })
    .join("");

  renderDayPanel();
}

function isTaskDoneOnDate(t, dateKey) {
  if (t.repeat === "weekly") {
    return t.doneDates && t.doneDates.includes(dateKey);
  }
  return t.done;
}

function toggleCalTask(id, dateKey) {
  const t = todos.find((x) => x.id === id);
  if (t) {
    if (t.repeat === "weekly") {
      if (!t.doneDates) t.doneDates = [];
      if (t.doneDates.includes(dateKey)) {
        t.doneDates = t.doneDates.filter((d) => d !== dateKey);
      } else {
        t.doneDates.push(dateKey);
      }
    } else {
      t.done = !t.done;
    }
    updateApp();
  }
}

function deleteCalTask(id) {
  deleteTodo(id);
}

function renderDayPanel() {
  const panel = document.getElementById("calDayPanel");
  if (!panel) return;

  const d = new Date(selectedDateKey + "T00:00:00");
  const label =
    weekdayNamesFull[d.getDay()] +
    ", " +
    d.getDate() +
    " " +
    monthNames[d.getMonth()].toLowerCase();
  const tasks = tasksForDate(selectedDateKey);

  const listHTML = tasks.length
    ? `<ul class="cal-task-list">${tasks
        .map((t) => {
          const isDone = isTaskDoneOnDate(t, selectedDateKey);
          return `
    <li class="cal-task ${isDone ? "done" : ""}">
<button class="todo-check ${isDone ? "checked" : ""}" style="width:17px;height:17px;margin-top:1px;" onclick="toggleCalTask(${t.id}, '${selectedDateKey}')">
  <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><path d="M5 13l4 4L19 7"/></svg>
</button>
<div style="flex:1; min-width:0;">
  <div class="cal-task-title" style="word-break: break-word;">${escapeHTML(t.title)}${t.repeat === "weekly" ? " 🔄" : ""}</div>
  <div class="cal-task-time">${t.time ? t.time : "Cả ngày"}</div>
</div>
<button class="todo-del" onclick="deleteCalTask(${t.id})" title="Xoá hoàn toàn">
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>
</button>
    </li>`;
        })
        .join("")}</ul>`
    : `<div class="cal-empty">Chưa có việc nào cho ngày này.</div>`;

  panel.innerHTML = `
    <div class="cal-day-title">${label.charAt(0).toUpperCase() + label.slice(1)}</div>
    <div class="cal-day-sub">${tasks.length} việc trong ngày</div>
    ${listHTML}
    <div class="cal-add-form">
<input type="text" id="calNewTitle" placeholder="Thêm việc cho ngày này…">
<div class="cal-add-row">
  <input type="time" id="calNewTime">
  <select id="calNewTag">
    <option value="hoctap">Học tập</option>
    <option value="canhan">Cá nhân</option>
    <option value="vat">Việc vặt</option>
  </select>
</div>
<div style="margin: 8px 0; font-size: 13px; color: var(--ink-soft);">
  <label style="display:flex; align-items:center; gap:6px; cursor:pointer;">
    <input type="checkbox" id="calNewRepeat"> Lặp lại hằng tuần
  </label>
</div>
<button onclick="addCalTask()">Thêm vào ngày ${d.getDate()}/${d.getMonth() + 1}</button>
    </div>`;
}

function addCalTask() {
  const titleEl = document.getElementById("calNewTitle");
  const title = titleEl.value.trim();
  if (!title) return;

  const isWeekly = document.getElementById("calNewRepeat").checked;
  todos.unshift({
    id: todoSeq++,
    title,
    tag: document.getElementById("calNewTag").value,
    done: false,
    date: selectedDateKey,
    time: document.getElementById("calNewTime").value || null,
    repeat: isWeekly ? "weekly" : "none",
    doneDates: isWeekly ? [] : null,
  });
  updateApp();
}

/* ---------- HOME PAGE LOGIC ---------- */

function renderHomeSchedule() {
  const label = document.getElementById("homeScheduleDateLabel");
  const list = document.getElementById("homeScheduleList");
  if (!label || !list) return;

  label.textContent = "Hôm nay"; // Lịch trình trên Home giờ chỉ focus vào hôm nay

  const tasks = tasksForDate(todayKey);

  if (tasks.length === 0) {
    list.innerHTML =
      '<div class="empty-note" style="padding: 0; font-size: 13px;">Trống. Bạn chưa xếp lịch nào cho hôm nay.</div>';
    return;
  }

  list.innerHTML = `<ul class="cal-task-list" style="margin-bottom:0;">${tasks
    .map((t) => {
      const isDone = isTaskDoneOnDate(t, todayKey);
      return `
    <li class="cal-task ${isDone ? "done" : ""}">
<button class="todo-check ${isDone ? "checked" : ""}" style="width:17px;height:17px;margin-top:1px;" onclick="toggleCalTask(${t.id}, '${todayKey}')">
  <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><path d="M5 13l4 4L19 7"/></svg>
</button>
<div style="flex:1; min-width:0;">
  <div class="cal-task-title" style="word-break: break-word;">${escapeHTML(t.title)}${t.repeat === "weekly" ? " 🔄" : ""}</div>
  <div class="cal-task-time">${t.time ? t.time : "Cả ngày"}</div>
</div>
    </li>`;
    })
    .join("")}</ul>`;
}

function getUpcomingItems() {
  let upcoming = [];
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  todos.forEach((t) => {
    if (!t.date) return;
    if (t.repeat === "weekly") {
      let nextOcc = new Date(t.date + "T00:00:00");
      while (nextOcc < now) {
        nextOcc.setDate(nextOcc.getDate() + 7);
      }
      const nextKey = formatDateKey(nextOcc);
      if (!t.doneDates || !t.doneDates.includes(nextKey)) {
        const diffDays = Math.round(
          (nextOcc - now) / (1000 * 60 * 60 * 24),
        );
        if (diffDays <= 7)
          upcoming.push({
            type: "todo",
            title: t.title,
            days: diffDays,
            rawDate: nextOcc,
          });
      }
    } else {
      if (!t.done) {
        const taskDate = new Date(t.date + "T00:00:00");
        const diffDays = Math.round(
          (taskDate - now) / (1000 * 60 * 60 * 24),
        );
        if (diffDays >= 0 && diffDays <= 7)
          upcoming.push({
            type: "todo",
            title: t.title,
            days: diffDays,
            rawDate: taskDate,
          });
      }
    }
  });

  notes.forEach((n) => {
    if (n.reminderRaw) {
      const remDate = new Date(n.reminderRaw);
      const remDateOnly = new Date(remDate);
      remDateOnly.setHours(0, 0, 0, 0);
      const diffDays = Math.round(
        (remDateOnly - now) / (1000 * 60 * 60 * 24),
      );
      if (diffDays >= 0 && diffDays <= 7) {
        upcoming.push({
          type: "note",
          title: n.title,
          days: diffDays,
          rawDate: remDate,
        });
      }
    }
  });

  upcoming.sort((a, b) => a.rawDate - b.rawDate);
  return upcoming;
}

function renderUpcoming() {
  const upcoming = getUpcomingItems();

  const list = document.getElementById("homeUpcomingList");
  const count = document.getElementById("homeUpcomingCount");
  if (list && count) {
    count.textContent = upcoming.length;
    list.innerHTML = upcoming.length
      ? upcoming
          .map((item) => {
            let timeText =
              item.days === 0
                ? "Hôm nay"
                : item.days === 1
                  ? "Ngày mai"
                  : `Còn ${item.days} ngày`;
            let icon = item.type === "note" ? "📝" : "✅";
            return `
  <li class="todo-item" style="padding: 10px 12px; background: transparent; border-color: rgba(0,0,0,0.05);">
      <div class="todo-body" style="display:flex; justify-content:space-between; align-items:center;">
          <div class="todo-title" style="font-size:13.5px;">${icon} ${escapeHTML(item.title)}</div>
          <div class="tag datechip" style="margin:0; font-size: 10.5px;">${timeText}</div>
      </div>
  </li>`;
          })
          .join("")
      : '<div class="empty-note">Không có sự kiện nào trong 7 ngày tới.</div>';
  }

  const bellBadge = document.querySelector(".dot-badge");
  const bellPanel = document.getElementById("bellPanel");
  if (bellBadge && bellPanel) {
    bellBadge.style.display = upcoming.length > 0 ? "block" : "none";
    let bellHtml = `<h3>Nhắc nhở sắp tới</h3>`;
    if (upcoming.length > 0) {
      bellHtml += upcoming
        .map((item) => {
          let timeText =
            item.days === 0
              ? "Hôm nay"
              : item.days === 1
                ? "Ngày mai"
                : `Còn ${item.days} ngày`;
          return `<div class="bell-item"><b>${escapeHTML(item.title)}</b><br>${item.type === "note" ? "Ghi chú" : "Công việc"} · ${timeText}</div>`;
        })
        .join("");
    } else {
      bellHtml += `<div class="bell-item">Không có nhắc nhở nào.</div>`;
    }
    bellPanel.innerHTML = bellHtml;
  }
}

function renderHome() {
  const el = document.getElementById("homeWeekday");
  if (el) {
    el.textContent = weekdayNamesFull[todayDate.getDay()];
    document.getElementById("homeDayNum").textContent =
      todayDate.getDate();
    document.getElementById("homeMonthYear").textContent =
      monthNames[todayDate.getMonth()] + ", " + todayDate.getFullYear();
  }

  renderHomeSchedule();

  const list = document.getElementById("homeChecklist");
  if (list) {
    const pending = todos.filter(
      (t) => (!t.done || t.repeat === "weekly") && t.repeat !== "weekly",
    );
    document.getElementById("homeChecklistCount").textContent =
      pending.length;
    list.innerHTML = pending.length
      ? pending.map(todoItemHtml).join("")
      : '<div class="empty-note">Không còn việc nào đang chờ — mọi thứ đã xong! 🎉</div>';
  }
}

/* ---------- NOTES LOGIC ---------- */
let selectedColor = "note-c1";

function toggleNoteForm() {
  document.getElementById("noteForm").classList.toggle("open");
}

function pickColor(el, cls) {
  document
    .querySelectorAll(".color-dot")
    .forEach((d) => d.classList.remove("selected"));
  el.classList.add("selected");
  selectedColor = cls;
}

function addNote() {
  const title = document.getElementById("noteTitle").value.trim();
  const body = document.getElementById("noteBody").value.trim();
  const rem = document.getElementById("noteReminder").value;
  if (!title) return;

  let reminderText = null;
  let reminderRaw = null;
  if (rem) {
    const d = new Date(rem);
    reminderRaw = rem;
    reminderText =
      d.toLocaleDateString("vi-VN", {
        day: "numeric",
        month: "numeric",
      }) +
      " · " +
      d.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
  }

  notes.unshift({
    id: noteSeq++,
    title,
    body,
    color: selectedColor,
    reminderText,
    reminderRaw,
  });

  document.getElementById("noteTitle").value = "";
  document.getElementById("noteBody").value = "";
  document.getElementById("noteReminder").value = "";
  toggleNoteForm();

  saveData();
  renderNotes();
  renderUpcoming();
}

function deleteNote(id) {
  notes = notes.filter((n) => n.id !== id);
  saveData();
  renderNotes();
  renderUpcoming();
}

function renderNotes() {
  document.getElementById("notesGrid").innerHTML = notes
    .map(
      (n) => `
    <div class="note-card ${n.color}">
<div class="note-tape"></div>
<button class="note-del" onclick="deleteNote(${n.id})">
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg>
</button>
<h3>${escapeHTML(n.title)}</h3>
<p>${escapeHTML(n.body).replace(/\n/g, "<br>")}</p>
${n.reminderText ? `<div class="note-reminder">🔔 ${n.reminderText}</div>` : ""}
    </div>`,
    )
    .join("");
}

loadData();
if (currentUser) {
  startApp();
}

// DARKMODE
function toggleDarkMode() {
  const isDark = document.body.classList.toggle("dark-theme");
  localStorage.setItem("sotay_theme", isDark ? "dark" : "light");
  updateThemeIcon(isDark);
}

function updateThemeIcon(isDark) {
  const icon = document.getElementById("themeIcon");
  if (!icon) return;
  if (isDark) {
    icon.innerHTML =
      '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';
  } else {
    icon.innerHTML =
      '<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"></path>';
  }
}

if (localStorage.getItem("sotay_theme") === "dark") {
  document.body.classList.add("dark-theme");
  updateThemeIcon(true);
}
