// checkin.js - Handles volunteer sign in / sign out

document.addEventListener('DOMContentLoaded', function() {
    const dateDisplay = document.getElementById('dateDisplay');
    const nameInput = document.getElementById('volunteerName');
    const dropdown = document.getElementById('autocompleteDropdown');
    const signInBtn = document.getElementById('signInBtn');
    const signOutBtn = document.getElementById('signOutBtn');
    const successMessage = document.getElementById('successMessage');
    const statusMessage = document.getElementById('statusMessage');

    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateDisplay.textContent = today.toLocaleDateString('en-US', options);

    // Update button states based on whether volunteer has an open session
    function updateButtonStates() {
        const name = nameInput.value.trim();
        if (!name) {
            signInBtn.disabled = false;
            signOutBtn.disabled = true;
            statusMessage.textContent = '';
            return;
        }

        const openSession = Storage.getOpenSession(name);
        if (openSession) {
            // Already signed in — only allow sign out
            signInBtn.disabled = true;
            signOutBtn.disabled = false;
            const timeIn = new Date(openSession.timeIn).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
            statusMessage.textContent = `✓ Signed in at ${timeIn} — ready to sign out`;
            statusMessage.className = 'status-message status-signed-in';
        } else {
            signInBtn.disabled = false;
            signOutBtn.disabled = true;
            statusMessage.textContent = '';
            statusMessage.className = 'status-message';
        }
    }

    // Name autocomplete
    nameInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase().trim();
        updateButtonStates();

        if (searchTerm.length === 0) {
            dropdown.style.display = 'none';
            return;
        }

        const volunteers = Storage.getVolunteers();
        const matches = volunteers.filter(name => name.toLowerCase().includes(searchTerm)).sort();

        if (matches.length > 0) {
            dropdown.innerHTML = matches.map(name =>
                `<div class="autocomplete-item">${escapeHtml(name)}</div>`
            ).join('');
            dropdown.style.display = 'block';

            document.querySelectorAll('.autocomplete-item').forEach(item => {
                item.addEventListener('click', function() {
                    nameInput.value = this.textContent;
                    dropdown.style.display = 'none';
                    updateButtonStates();
                });
            });
        } else {
            dropdown.style.display = 'none';
        }
    });

    document.addEventListener('click', function(e) {
        if (!nameInput.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });

    // Sign In
    signInBtn.addEventListener('click', function() {
        const name = nameInput.value.trim();
        if (!name) {
            alert('Please enter your name.');
            return;
        }

        // Check for existing open session
        if (Storage.getOpenSession(name)) {
            alert(`${name} is already signed in today! Please sign out instead.`);
            return;
        }

        Storage.signIn(name);
        showSuccess(`✓ ${name} signed in at ${new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}`);
        resetForm();
    });

    // Sign Out
    signOutBtn.addEventListener('click', function() {
        const name = nameInput.value.trim();
        if (!name) {
            alert('Please enter your name.');
            return;
        }

        const success = Storage.signOut(name);
        if (!success) {
            alert(`No open sign-in found for ${name} today. Please sign in first.`);
            return;
        }

        showSuccess(`✓ ${name} signed out at ${new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}`);
        resetForm();
    });

    function showSuccess(message) {
        successMessage.textContent = message;
        successMessage.classList.add('show');
        setTimeout(() => successMessage.classList.remove('show'), 4000);
    }

    function resetForm() {
        nameInput.value = '';
        dropdown.style.display = 'none';
        statusMessage.textContent = '';
        statusMessage.className = 'status-message';
        signInBtn.disabled = false;
        signOutBtn.disabled = true;
        nameInput.focus();
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Initialize button states
    updateButtonStates();
});