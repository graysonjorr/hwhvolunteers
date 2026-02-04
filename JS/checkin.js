// checkin.js - Handles volunteer check-in functionality

document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const dateDisplay = document.getElementById('dateDisplay');
    const nameInput = document.getElementById('volunteerName');
    const dropdown = document.getElementById('autocompleteDropdown');
    const shiftButtons = document.querySelectorAll('.shift-btn');
    const form = document.getElementById('checkinForm');
    const successMessage = document.getElementById('successMessage');
    
    let selectedShift = null;
    const today = new Date();
    
    // Display today's date
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateDisplay.textContent = today.toLocaleDateString('en-US', options);
    
    // Name autocomplete functionality
    nameInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase().trim();
        
        if (searchTerm.length === 0) {
            dropdown.style.display = 'none';
            return;
        }
        
        const volunteers = Storage.getVolunteers();
        const matches = volunteers.filter(name => 
            name.toLowerCase().includes(searchTerm)
        ).sort();
        
        if (matches.length > 0) {
            dropdown.innerHTML = matches.map(name => 
                `<div class="autocomplete-item">${escapeHtml(name)}</div>`
            ).join('');
            dropdown.style.display = 'block';
            
            // Add click handlers to autocomplete items
            document.querySelectorAll('.autocomplete-item').forEach(item => {
                item.addEventListener('click', function() {
                    nameInput.value = this.textContent;
                    dropdown.style.display = 'none';
                });
            });
        } else {
            dropdown.style.display = 'none';
        }
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!nameInput.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });
    
    // Shift selection
    shiftButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            shiftButtons.forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
            selectedShift = this.dataset.shift;
        });
    });
    
    // Form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = nameInput.value.trim();
        
        if (!name || !selectedShift) {
            alert('Please enter your name and select a shift!');
            return;
        }
        
        // Add check-in
        Storage.addCheckin({
            name: name,
            shift: selectedShift,
            date: today.toISOString().split('T')[0],
            timestamp: new Date().toISOString()
        });
        
        // Show success message
        successMessage.classList.add('show');
        setTimeout(() => {
            successMessage.classList.remove('show');
        }, 3000);
        
        // Reset form
        nameInput.value = '';
        shiftButtons.forEach(b => b.classList.remove('selected'));
        selectedShift = null;
        dropdown.style.display = 'none';
        
        nameInput.focus();
    });
    
    // Helper function to escape HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});