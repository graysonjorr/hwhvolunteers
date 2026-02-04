// storage.js - Handles all localStorage operations

const Storage = {
    // Keys for localStorage
    KEYS: {
        VOLUNTEERS: 'volunteers',
        CHECKINS: 'checkins'
    },

    // Initialize storage if not exists
    init() {
        if (!this.getVolunteers()) {
            localStorage.setItem(this.KEYS.VOLUNTEERS, JSON.stringify([]));
        }
        if (!this.getCheckins()) {
            localStorage.setItem(this.KEYS.CHECKINS, JSON.stringify([]));
        }
    },

    // Volunteer operations
    getVolunteers() {
        try {
            return JSON.parse(localStorage.getItem(this.KEYS.VOLUNTEERS)) || [];
        } catch (e) {
            console.error('Error reading volunteers:', e);
            return [];
        }
    },

    addVolunteer(name) {
        const volunteers = this.getVolunteers();
        if (!volunteers.includes(name)) {
            volunteers.push(name);
            volunteers.sort();
            localStorage.setItem(this.KEYS.VOLUNTEERS, JSON.stringify(volunteers));
        }
    },

    // Check-in operations
    getCheckins() {
        try {
            return JSON.parse(localStorage.getItem(this.KEYS.CHECKINS)) || [];
        } catch (e) {
            console.error('Error reading check-ins:', e);
            return [];
        }
    },

    addCheckin(checkin) {
        const checkins = this.getCheckins();
        checkins.push({
            id: Date.now(),
            name: checkin.name,
            shift: checkin.shift,
            date: checkin.date,
            timestamp: checkin.timestamp || new Date().toISOString()
        });
        localStorage.setItem(this.KEYS.CHECKINS, JSON.stringify(checkins));
        
        // Also add volunteer to list if new
        this.addVolunteer(checkin.name);
    },

    deleteCheckin(id) {
        const checkins = this.getCheckins();
        const filtered = checkins.filter(c => c.id !== id);
        localStorage.setItem(this.KEYS.CHECKINS, JSON.stringify(filtered));
    },

    // Filter operations
    getFilteredCheckins(filters = {}) {
        let checkins = this.getCheckins();
        
        if (filters.date) {
            checkins = checkins.filter(c => c.date === filters.date);
        }
        
        if (filters.volunteer) {
            checkins = checkins.filter(c => c.name === filters.volunteer);
        }
        
        if (filters.shift) {
            checkins = checkins.filter(c => c.shift === filters.shift);
        }
        
        return checkins;
    },

    // Statistics
    getStats(filters = {}) {
        const checkins = this.getFilteredCheckins(filters);
        const uniqueVolunteers = new Set(checkins.map(c => c.name));
        
        let morningCount = 0;
        let afternoonCount = 0;
        
        checkins.forEach(c => {
            if (c.shift === 'morning') {
                morningCount++;
            } else if (c.shift === 'afternoon') {
                afternoonCount++;
            } else if (c.shift === 'both') {
                morningCount++;
                afternoonCount++;
            }
        });
        
        return {
            totalCheckins: checkins.length,
            uniqueVolunteers: uniqueVolunteers.size,
            morningShifts: morningCount,
            afternoonShifts: afternoonCount
        };
    },

    // Export to CSV
    exportToCSV(filters = {}) {
        const checkins = this.getFilteredCheckins(filters);
        
        if (checkins.length === 0) {
            return null;
        }
        
        let csv = 'Date,Volunteer Name,Shift,Time\n';
        checkins.forEach(c => {
            const date = new Date(c.timestamp);
            const dateStr = date.toLocaleDateString();
            const timeStr = date.toLocaleTimeString();
            csv += `${dateStr},"${c.name}",${c.shift},${timeStr}\n`;
        });
        
        return csv;
    },

    // Clear all data (use with caution)
    clearAll() {
        if (confirm('Are you sure you want to delete ALL data? This cannot be undone!')) {
            localStorage.removeItem(this.KEYS.VOLUNTEERS);
            localStorage.removeItem(this.KEYS.CHECKINS);
            this.init();
            return true;
        }
        return false;
    }
};

// Initialize storage on load
Storage.init();