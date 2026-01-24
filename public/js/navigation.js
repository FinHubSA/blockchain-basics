// Navigation functionality - shared across all pages
// This file dynamically renders the navigation drawer

// Render the navigation drawer
function renderNavigation() {
    const drawer = document.getElementById('drawer');
    if (!drawer) return;

    // Get current path for active page highlighting
    const currentPath = window.location.pathname;

    // Build navigation HTML
    let navHTML = `
        <div class="drawer-header">
            <h2>Blockchain Concepts</h2>
        </div>
        <nav class="drawer-nav">
    `;

    navigationData.topics.forEach(topic => {
        // Normalize current path for comparison
        const normalizedCurrentPath = currentPath.replace(/^\/+/, '').toLowerCase();
        
        // Check if current page belongs to this topic
        const isCurrentTopic = topic.pages.some(page => {
            const normalizedPagePath = page.path.replace(/^\/+/, '').toLowerCase();
            return normalizedCurrentPath === normalizedPagePath || 
                   normalizedCurrentPath.endsWith(normalizedPagePath);
        });

        // Determine if topic should be expanded
        const isExpanded = topic.expanded || isCurrentTopic;

        navHTML += `
            <div class="nav-section">
                <div class="nav-item main-item ${isExpanded ? 'expanded' : ''}" data-topic="${topic.id}">
                    <span class="nav-icon">${topic.icon}</span>
                    <span class="nav-text">${topic.name}</span>
                    <span class="nav-arrow">▼</span>
                </div>
                <div class="nav-submenu ${isExpanded ? 'expanded' : ''}" id="${topic.id}-submenu">
        `;

        topic.pages.forEach(page => {
            // Normalize paths for comparison
            const normalizedPagePath = page.path.replace(/^\/+/, '').toLowerCase();
            const isActive = normalizedCurrentPath === normalizedPagePath || 
                           normalizedCurrentPath.endsWith(normalizedPagePath);
            
            navHTML += `
                <a href="${page.path}" class="nav-item sub-item ${isActive ? 'active' : ''}">
                    <span class="nav-text">${page.name}</span>
                </a>
            `;
        });

        navHTML += `
                </div>
            </div>
        `;
    });

    navHTML += `
        </nav>
    `;

    // Insert navigation HTML into drawer
    drawer.innerHTML = navHTML;

    // Initialize navigation interactions
    initializeNavigationInteractions();
}

// Initialize navigation interactions
function initializeNavigationInteractions() {
    const menuToggle = document.getElementById('menuToggle');
    const drawer = document.getElementById('drawer');

    // Menu toggle for mobile
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            drawer.classList.toggle('open');
        });
    }

    // Main item click (expand/collapse submenu)
    document.querySelectorAll('.nav-item.main-item').forEach(item => {
        item.addEventListener('click', (e) => {
            // Don't toggle if clicking on a link inside
            if (e.target.closest('a')) {
                return;
            }
            
            const topic = item.dataset.topic;
            const submenu = document.getElementById(`${topic}-submenu`);
            
            if (submenu) {
                submenu.classList.toggle('expanded');
                item.classList.toggle('expanded');
            }
        });
    });

    // Close drawer on mobile when clicking a link
    document.querySelectorAll('.nav-item.sub-item').forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                drawer.classList.remove('open');
            }
        });
    });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    renderNavigation();
});
