// dashboard.js - Handles dashboard functionality

document.addEventListener('DOMContentLoaded', function() {
    let currentView = 'byDate';

    loadData();

    document.getElementById('filterDate').addEventListener('change', loadData);
    document.getElementById('filterVolunteer').addEventListener('change', loadData);
    document.getElementById('filterStatus').addEventListener('change', loadData);

    // Auto-refresh every 10 seconds
    setInterval(loadData, 10000);

    function loadData() {
        const volunteers = Storage.getVolunteers();
        const volunteerFilter = document.getElementById('filterVolunteer');
        const currentSelection = volunteerFilter.value;

        volunteerFilter.innerHTML = '<option value="">All Volunteers</option>' +
            volunteers.map(v => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join('');
        volunteerFilter.value = currentSelection;

        updateStats();
        updateTables();
    }

    function getFilters() {
        return {
            date: document.getElementById('filterDate').value,
            volunteer: document.getElementById('filterVolunteer').value,
            status: document.getElementById('filterStatus').value
        };
    }

    function updateStats() {
        const stats = Storage.getStats(getFilters());
        document.getElementById('totalSessions').textContent = stats.totalSessions;
        document.getElementById('uniqueVolunteers').textContent = stats.uniqueVolunteers;
        document.getElementById('openSessions').textContent = stats.openSessions;
        document.getElementById('totalHours').textContent = stats.totalHours;
    }

    function updateTables() {
        if (currentView === 'byDate') {
            updateSessionTable();
        } else {
            updateVolunteerTable();
        }
    }

    function updateSessionTable() {
        const sessions = Storage.getFilteredSessions(getFilters());
        const tbody = document.getElementById('sessionTableBody');

        if (sessions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="no-data">No sessions found</td></tr>';
            return;
        }

        sessions.sort((a, b) => new Date(b.timeIn) - new Date(a.timeIn));

        tbody.innerHTML = sessions.map(s => {
            const date = new Date(s.timeIn).toLocaleDateString();
            const timeIn = new Date(s.timeIn).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
            const timeOut = s.timeOut
                ? new Date(s.timeOut).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})
                : '<span class="badge badge-open">Still Here</span>';
            const hours = Storage.calcHours(s.timeIn, s.timeOut);
            const hoursDisplay = hours !== null ? `${hours} hrs` : '—';

            return `
                <tr>
                    <td>${date}</td>
                    <td><strong>${escapeHtml(s.name)}</strong></td>
                    <td>${timeIn}</td>
                    <td>${timeOut}</td>
                    <td>${hoursDisplay}</td>
                    <td><button class="delete-btn" onclick="deleteSession(${s.id})">Delete</button></td>
                </tr>
            `;
        }).join('');
    }

    function updateVolunteerTable() {
        const sessions = Storage.getFilteredSessions(getFilters());
        const tbody = document.getElementById('volunteerTableBody');

        if (sessions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="no-data">No sessions found</td></tr>';
            return;
        }

        const volunteerData = {};
        sessions.forEach(s => {
            if (!volunteerData[s.name]) {
                volunteerData[s.name] = {
                    name: s.name,
                    sessions: 0,
                    totalHours: 0,
                    lastVisit: s.timeIn
                };
            }
            const v = volunteerData[s.name];
            v.sessions++;
            const hrs = Storage.calcHours(s.timeIn, s.timeOut);
            if (hrs !== null) v.totalHours += hrs;
            if (new Date(s.timeIn) > new Date(v.lastVisit)) v.lastVisit = s.timeIn;
        });

        const volunteers = Object.values(volunteerData).sort((a, b) => a.name.localeCompare(b.name));

        tbody.innerHTML = volunteers.map(v => `
            <tr>
                <td><strong>${escapeHtml(v.name)}</strong></td>
                <td>${v.sessions}</td>
                <td><strong>${Math.round(v.totalHours * 100) / 100} hrs</strong></td>
                <td>${new Date(v.lastVisit).toLocaleDateString()}</td>
            </tr>
        `).join('');
    }

    // Global functions
    window.switchView = function(view) {
        currentView = view;
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.data-view').forEach(v => v.classList.remove('active'));

        if (view === 'byDate') {
            document.querySelector('[onclick="switchView(\'byDate\')"]').classList.add('active');
            document.getElementById('byDateView').classList.add('active');
        } else {
            document.querySelector('[onclick="switchView(\'byVolunteer\')"]').classList.add('active');
            document.getElementById('byVolunteerView').classList.add('active');
        }

        updateTables();
    };

    window.deleteSession = function(id) {
        if (!confirm('Delete this session record?')) return;
        Storage.deleteSession(id);
        loadData();
    };

    window.clearFilters = function() {
        document.getElementById('filterDate').value = '';
        document.getElementById('filterVolunteer').value = '';
        document.getElementById('filterStatus').value = '';
        loadData();
    };

    window.exportData = function() {
        const csv = Storage.exportToCSV(getFilters());
        if (!csv) {
            alert('No data to export!');
            return;
        }
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `volunteer-hours-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});