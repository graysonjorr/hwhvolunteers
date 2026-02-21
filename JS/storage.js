// storage.js - Handles all localStorage operations

const Storage = {
    KEYS: {
        VOLUNTEERS: 'volunteers',
        SESSIONS: 'sessions'
    },

    init() {
        if (!localStorage.getItem(this.KEYS.VOLUNTEERS)) {
            localStorage.setItem(this.KEYS.VOLUNTEERS, JSON.stringify([]));
        }
        if (!localStorage.getItem(this.KEYS.SESSIONS)) {
            localStorage.setItem(this.KEYS.SESSIONS, JSON.stringify([]));
        }
    },

    // Volunteer operations
    getVolunteers() {
        try {
            return JSON.parse(localStorage.getItem(this.KEYS.VOLUNTEERS)) || [];
        } catch (e) {
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

    // Session operations
    getSessions() {
        try {
            return JSON.parse(localStorage.getItem(this.KEYS.SESSIONS)) || [];
        } catch (e) {
            return [];
        }
    },

    // Find an open (not yet signed out) session for a volunteer today
    getOpenSession(name) {
        const today = new Date().toISOString().split('T')[0];
        const sessions = this.getSessions();
        return sessions.find(s => s.name === name && s.date === today && !s.timeOut) || null;
    },

    // Sign in - creates a new session
    signIn(name) {
        const sessions = this.getSessions();
        const now = new Date();
        sessions.push({
            id: Date.now(),
            name: name,
            date: now.toISOString().split('T')[0],
            timeIn: now.toISOString(),
            timeOut: null
        });
        localStorage.setItem(this.KEYS.SESSIONS, JSON.stringify(sessions));
        this.addVolunteer(name);
        return true;
    },

    // Sign out - finds open session and closes it
    signOut(name) {
        const sessions = this.getSessions();
        const today = new Date().toISOString().split('T')[0];
        const idx = sessions.findIndex(s => s.name === name && s.date === today && !s.timeOut);
        if (idx === -1) return false; // No open session found

        sessions[idx].timeOut = new Date().toISOString();
        localStorage.setItem(this.KEYS.SESSIONS, JSON.stringify(sessions));
        return true;
    },

    deleteSession(id) {
        const sessions = this.getSessions();
        localStorage.setItem(this.KEYS.SESSIONS, JSON.stringify(sessions.filter(s => s.id !== id)));
    },

    // Calculate hours between two ISO timestamps
    calcHours(timeIn, timeOut) {
        if (!timeIn || !timeOut) return null;
        const diff = (new Date(timeOut) - new Date(timeIn)) / (1000 * 60 * 60);
        return Math.round(diff * 100) / 100;
    },

    // Filter sessions
    getFilteredSessions(filters = {}) {
        let sessions = this.getSessions();

        if (filters.date) {
            sessions = sessions.filter(s => s.date === filters.date);
        }
        if (filters.volunteer) {
            sessions = sessions.filter(s => s.name === filters.volunteer);
        }
        if (filters.status === 'open') {
            sessions = sessions.filter(s => !s.timeOut);
        } else if (filters.status === 'complete') {
            sessions = sessions.filter(s => !!s.timeOut);
        }

        return sessions;
    },

    // Statistics
    getStats(filters = {}) {
        const sessions = this.getFilteredSessions(filters);
        const uniqueVolunteers = new Set(sessions.map(s => s.name));
        const completed = sessions.filter(s => s.timeOut);
        const totalHours = completed.reduce((sum, s) => sum + (this.calcHours(s.timeIn, s.timeOut) || 0), 0);

        return {
            totalSessions: sessions.length,
            uniqueVolunteers: uniqueVolunteers.size,
            completedSessions: completed.length,
            openSessions: sessions.filter(s => !s.timeOut).length,
            totalHours: Math.round(totalHours * 100) / 100
        };
    },

    // Export to CSV
    exportToCSV(filters = {}) {
        const sessions = this.getFilteredSessions(filters);
        if (sessions.length === 0) return null;

        let csv = 'Date,Volunteer Name,Sign In Time,Sign Out Time,Hours Worked\n';
        sessions.sort((a, b) => new Date(a.timeIn) - new Date(b.timeIn));
        sessions.forEach(s => {
            const date = new Date(s.timeIn).toLocaleDateString();
            const timeIn = new Date(s.timeIn).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
            const timeOut = s.timeOut ? new Date(s.timeOut).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) : '';
            const hours = this.calcHours(s.timeIn, s.timeOut) ?? '';
            csv += `${date},"${s.name}",${timeIn},${timeOut},${hours}\n`;
        });

        return csv;
    },

    clearAll() {
        if (confirm('Are you sure you want to delete ALL data? This cannot be undone!')) {
            localStorage.removeItem(this.KEYS.VOLUNTEERS);
            localStorage.removeItem(this.KEYS.SESSIONS);
            this.init();
            return true;
        }
        return false;
    }
};

Storage.init();