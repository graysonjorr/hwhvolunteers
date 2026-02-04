// dashboard.js - Handles dashboard functionality

document.addEventListener('DOMContentLoaded', function() {
    let currentView = 'byDate';
    
    // Initialize
    loadData();
    
    // Set up filter event listeners
    document.getElementById('filterDate').addEventListener('change', loadData);
    document.getElementById('filterVolunteer').addEventListener('change', loadData);
    document.getElementById('filterShift').addEventListener('change', loadData);
    
    // Auto-refresh every 5 seconds
    setInterval(loadData, 5000);
    
    function loadData() {
        // Update volunteer filter dropdown
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
            shift: document.getElementById('filterShift').value
        };
    }
    
    function updateStats() {
        const filters = getFilters();
        const stats = Storage.getStats(filters);
        
        document.getElementById('totalCheckins').textContent = stats.totalCheckins;
        document.getElementById('uniqueVolunteers').textContent = stats.uniqueVolunteers;
        document.getElementById('morningShifts').textContent = stats.morningShifts;
        document.getElementById('afternoonShifts').textContent = stats.afternoonShifts;
    }
    
    function updateTables() {
        if (currentView === 'byDate') {
            updateDateTable();
        } else {
            updateVolunteerTable();
        }
    }
    
    function updateDateTable() {
        const filters = getFilters();
        const checkins = Storage.getFilteredCheckins(filters);
        const tbody = document.getElementById('dateTableBody');
        
        if (checkins.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="no-data">No check-ins found</td></tr>';
            return;
        }
        
        // Sort by date (newest first)
        checkins.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        tbody.innerHTML = checkins.map(c => {
            const date = new Date(c.timestamp);
            const dateStr = date.toLocaleDateString();
            const timeStr = date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
            const shiftCapitalized = c.shift.charAt(0).toUpperCase() + c.shift.slice(1);
            
            return `
                <tr>
                    <td>${dateStr}</td>
                    <td><strong>${escapeHtml(c.name)}</strong></td>
                    <td><span class="badge badge-${c.shift}">${shiftCapitalized}</span></td>
                    <td>${timeStr}</td>
                    <td><button class="delete-btn" onclick="deleteCheckin(${c.id})">Delete</button></td>
                </tr>
            `;
        }).join('');
    }
    
    function updateVolunteerTable() {
        const filters = getFilters();
        const checkins = Storage.getFilteredCheckins(filters);
        const tbody = document.getElementById('volunteerTableBody');
        
        if (checkins.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="no-data">No check-ins found</td></tr>';
            return;
        }
        
        // Group by volunteer
        const volunteerData = {};
        checkins.forEach(c => {
            if (!volunteerData[c.name]) {
                volunteerData[c.name] = {
                    name: c.name,
                    morningCount: 0,
                    afternoonCount: 0,
                    bothCount: 0,
                    totalHours: 0,
                    lastCheckin: c.timestamp
                };
            }
            
            const vData = volunteerData[c.name];
            if (c.shift === 'morning') {
                vData.morningCount++;
                vData.totalHours += 4;
            } else if (c.shift === 'afternoon') {
                vData.afternoonCount++;
                vData.totalHours += 4;
            } else if (c.shift === 'both') {
                vData.bothCount++;
                vData.totalHours += 8;
            }
            
            if (new Date(c.timestamp) > new Date(vData.lastCheckin)) {
                vData.lastCheckin = c.timestamp;
            }
        });
        
        // Convert to array and sort by name
        const volunteers = Object.values(volunteerData).sort((a, b) => 
            a.name.localeCompare(b.name)
        );
        
        tbody.innerHTML = volunteers.map(v => {
            const lastDate = new Date(v.lastCheckin).toLocaleDateString();
            return `
                <tr>
                    <td><strong>${escapeHtml(v.name)}</strong></td>
                    <td><strong>${v.totalHours} hours</strong></td>
                    <td>${v.morningCount}</td>
                    <td>${v.afternoonCount}</td>
                    <td>${v.bothCount}</td>
                    <td>${lastDate}</td>
                </tr>
            `;
        }).join('');
    }
    
    // Make these functions global so they can be called from HTML
    window.switchView = function(view) {
        currentView = view;
        
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.data-view').forEach(view => view.classList.remove('active'));
        
        if (view === 'byDate') {
            document.querySelector('[onclick="switchView(\'byDate\')"]').classList.add('active');
            document.getElementById('byDateView').classList.add('active');
        } else {
            document.querySelector('[onclick="switchView(\'byVolunteer\')"]').classList.add('active');
            document.getElementById('byVolunteerView').classList.add('active');
        }
        
        updateTables();
    };
    
    window.deleteCheckin = function(id) {
        if (!confirm('Are you sure you want to delete this check-in?')) return;
        
        Storage.deleteCheckin(id);
        loadData();
    };
    
    window.clearFilters = function() {
        document.getElementById('filterDate').value = '';
        document.getElementById('filterVolunteer').value = '';
        document.getElementById('filterShift').value = '';
        loadData();
    };
    
    window.exportData = function() {
        const filters = getFilters();
        const csv = Storage.exportToCSV(filters);
        
        if (!csv) {
            alert('No data to export!');
            return;
        }
        
        // Create download
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `volunteer-hours-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };
    
    // Helper function
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});