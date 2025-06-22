// NOT ACTIVE CODE
///public/scripts/students/calendarView.js
// FullCalendar integration with Google Calendar CRUD and Free/Busy

let calendar = null;

/**
 * Entry point: wire up Free/Busy button and render calendar
 */
export function initCalendarView() {
  const token = localStorage.getItem("google_oauth_token");
  if (!token) {
    alert("Please sign in with Google first.");
    return;
  }

  document.getElementById('find-time-btn')?.addEventListener('click', () => {
    handleFreeBusyClick(token);
  });

  setupCalendar(token);
}

/**
 * Configure and render the FullCalendar instance
 */
function setupCalendar(token) {
  if (!window.FullCalendar) {
    throw new Error("FullCalendar not loaded. Include the standard bundle in HTML.");
  }

  const el = document.getElementById("calendar");
  if (!el) {
    throw new Error("#calendar element not found");
  }

  if (calendar) {
    calendar.destroy();
  }

  calendar = new FullCalendar.Calendar(el, {
    initialView: 'timeGridWeek',
    headerToolbar: {
      left:   'prev,next today',
      center: 'title',
      right:  'dayGridMonth,timeGridWeek,timeGridDay'
    },
    editable:   true,
    selectable: true,
    navLinks:   true,

    events: (info, success) => fetchAndRenderEvents(token, info.start, info.end, success),
    dateClick: info => handleDateClick(token, info),
    eventClick: info => handleEventClick(token, info),
    eventDrop: info => handleEventDrop(token, info),
    eventResize: info => handleEventResize(token, info)
  });

  calendar.render();
}

/**
 * Fetch events and pass to FullCalendar
 */
async function fetchAndRenderEvents(token, start, end, successCallback) {
  try {
    const events = await fetchGoogleEvents(token, start, end);
    successCallback(events);
  } catch (err) {
    console.error("Event load failed:", err);
    successCallback([]);
  }
}

/**
 * Prompt user to create a new event
 */
async function handleDateClick(token, info) {
  const raw = prompt("New meeting title:");
  if (!raw) return;
  const title = raw.trim();
  if (!title) return;

  try {
    await createGoogleEvent(token, title, info.dateStr);
    calendar.refetchEvents();
    alert("Event created!");
  } catch (err) {
    console.error("Create failed:", err);
    alert("Create failed: " + err.message);
  }
}

/**
 * Handle click on an existing event for edit/delete/invite
 */
async function handleEventClick(token, info) {
  const e = info.event;
  const raw = prompt("Type EDIT, DELETE, or INVITE:");
  if (!raw) return;
  const action = raw.trim().toUpperCase();

  try {
    if (action === 'EDIT') {
      const newTitleRaw = prompt("New title:", e.title);
      if (!newTitleRaw) return;
      const newTitle = newTitleRaw.trim();
      if (!newTitle) return;
      await updateGoogleEvent(token, e.id, { summary: newTitle });
      e.setProp('title', newTitle);

    } else if (action === 'DELETE') {
      if (!confirm("Really delete this event?")) return;
      await deleteGoogleEvent(token, e.id);
      e.remove();

    } else if (action === 'INVITE') {
      const emailsRaw = prompt("Attendee emails (comma-separated):");
      if (!emailsRaw) return;
      const attendees = emailsRaw
        .split(',')
        .map(s => s.trim())
        .filter(s => s)
        .map(email => ({ email }));
      if (attendees.length === 0) return;
      await updateGoogleEvent(token, e.id, { attendees });
      alert("Invites sent!");
    }
  } catch (err) {
    console.error("Action failed:", err);
    alert(action + " failed: " + err.message);
  }
}

/**
 * Handle dragging an event to a new time
 */
async function handleEventDrop(token, info) {
  const e = info.event;
  const updates = {
    start: { dateTime: e.start.toISOString(), timeZone: 'America/Los_Angeles' },
    end:   { dateTime: (e.end||e.start).toISOString(), timeZone: 'America/Los_Angeles' }
  };
  try {
    await updateGoogleEvent(token, e.id, updates);
  } catch (err) {
    console.error("Move failed:", err);
    alert("Move failed: " + err.message);
    info.revert();
  }
}

/**
 * Handle resizing an event’s duration
 */
async function handleEventResize(token, info) {
  const e = info.event;
  const updates = {
    end: { dateTime: e.end.toISOString(), timeZone: 'America/Los_Angeles' }
  };
  try {
    await updateGoogleEvent(token, e.id, updates);
  } catch (err) {
    console.error("Resize failed:", err);
    alert("Resize failed: " + err.message);
    info.revert();
  }
}

/**
 * Query free/busy slots and display JSON
 */
async function handleFreeBusyClick(token) {
  try {
    const startDate = prompt("Start date (YYYY-MM-DD):", new Date().toISOString().slice(0,10));
    const endDate   = prompt("End date (YYYY-MM-DD):",
      new Date(Date.now()+7*24*60*60*1000).toISOString().slice(0,10)
    );
    if (!startDate || !endDate) return;
    const timeMin = new Date(startDate).toISOString();
    const timeMax = new Date(endDate).toISOString();
    const fb = await queryFreeBusy(token, timeMin, timeMax);
    document.getElementById('freebusy-output').textContent = JSON.stringify(fb, null, 2);
  } catch (err) {
    console.error("FreeBusy failed:", err);
    alert("Free/Busy query failed: " + err.message);
  }
}

// === Google Calendar API helper functions ===

async function fetchGoogleEvents(token, start, end) {
  const timeMin = new Date(start).toISOString();
  const timeMax = new Date(end).toISOString();
  const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
  url.searchParams.set('timeMin', timeMin);
  url.searchParams.set('timeMax', timeMax);
  url.searchParams.set('singleEvents', 'true');
  url.searchParams.set('orderBy', 'startTime');
  
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw await res.json();
  const data = await res.json();
  return (data.items || []).map(evt => ({
    id:    evt.id,
    title: evt.summary,
    start: evt.start.dateTime || evt.start.date,
    end:   evt.end.dateTime   || evt.end.date
  }));
}

async function createGoogleEvent(token, summary, startISO) {
  const start = new Date(startISO).toISOString();
  const end   = new Date(new Date(startISO).getTime() + 3600000).toISOString();
  const ev = {
    summary,
    start: { dateTime: start, timeZone: 'America/Los_Angeles' },
    end:   { dateTime: end,   timeZone: 'America/Los_Angeles' }
  };
  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(ev)
  });
  if (!res.ok) throw await res.json();
}

async function updateGoogleEvent(token, eventId, updates) {
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
    { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(updates) }
  );
  if (!res.ok) throw await res.json();
}

async function deleteGoogleEvent(token, eventId) {
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
    { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw await res.json();
}

async function queryFreeBusy(token, timeMin, timeMax, calendarIds = ['primary']) {
  const body = { timeMin, timeMax, items: calendarIds.map(id => ({ id })) };
  const res  = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  });
  if (!res.ok) throw await res.json();
  return (await res.json()).calendars;
}
