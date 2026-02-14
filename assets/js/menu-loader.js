(function () {
    var fallbackTemplates = {
        "default": [
            '<nav>',
            '    <div class="nav-container">',
            '        <a class="logo" href="{{ROOT}}/index.html">Kamran Khalid</a>',
            '        <button class="menu-toggle" onclick="toggleMenu()">',
            '            <span></span><span></span><span></span>',
            '        </button>',
            '        <ul class="nav-links" id="navLinks">',
            '            <li><a href="{{ROOT}}/index.html" data-menu-key="home">Home</a></li>',
            '            <li class="nav-item dropdown">',
            '                <a href="{{ROOT}}/experience.html" data-menu-key="experience">Experience</a>',
            '                <div class="nav-dropdown">',
            '                    <a href="{{ROOT}}/experience.html" data-menu-key="experience-overview">Experience Overview</a>',
            '                    <a href="{{ROOT}}/proconvey.html" data-menu-key="proconvey">ProConvey</a>',
            '                </div>',
            '            </li>',
            '            <li><a href="{{ROOT}}/education.html" data-menu-key="education">Education</a></li>',
            '            <li><a href="{{ROOT}}/recommendations.html" data-menu-key="recommendations">Recommendations</a></li>',
            '            <li class="nav-item dropdown">',
            '                <a href="{{ROOT}}/community.html" data-menu-key="community">Community</a>',
            '                <div class="nav-dropdown">',
            '                    <a href="{{ROOT}}/fintech-api-workshop.html" data-menu-key="fintech-api-workshop" title="GDG on Campus The University of Manchester - Manchester, United Kingdom">Engineering a Fintech Payment API</a>',
            '                </div>',
            '            </li>',
            '        </ul>',
            '    </div>',
            '</nav>'
        ].join('\n'),
        "fintech": [
            '<nav>',
            '    <div class="nav-container">',
            '        <a class="logo" href="{{ROOT}}/index.html">Kamran Khalid</a>',
            '        <button class="menu-toggle" onclick="toggleMenu()">',
            '            <span></span><span></span><span></span>',
            '        </button>',
            '        <ul class="nav-links" id="navLinks">',
            '            <li><a href="{{ROOT}}/index.html" data-menu-key="home">Home</a></li>',
            '            <li><a href="{{ROOT}}/community.html" data-menu-key="community">Community</a></li>',
            '            <li><a href="{{ROOT}}/education.html" data-menu-key="education">Education</a></li>',
            '            <li><a href="{{ROOT}}/experience.html" data-menu-key="experience">Experience</a></li>',
            '            <li><a href="{{ROOT}}/proconvey.html" data-menu-key="proconvey">ProConvey</a></li>',
            '            <li><a href="{{ROOT}}/recommendations.html" data-menu-key="recommendations">Recommendations</a></li>',
            '            <li><a href="{{ROOT}}/fintech-api.html" data-menu-key="fintech-api">Fintech API</a></li>',
            '            <li><a href="{{ROOT}}/fintech-api-workshop.html" data-menu-key="fintech-api-workshop">Engineering a Fintech Payment API</a></li>',
            '        </ul>',
            '    </div>',
            '</nav>'
        ].join('\n')
    };

    function toggleMenu() {
        var navLinks = document.getElementById('navLinks');
        if (!navLinks) return;
        navLinks.classList.toggle('active');
    }

    window.toggleMenu = window.toggleMenu || toggleMenu;

    function resolveRoot(value) {
        if (!value || value === '.') return '';
        return value.replace(/\/$/, '');
    }

    function setActiveLinks() {
        var body = document.body;
        if (!body) return;

        var keys = (body.getAttribute('data-menu-active') || '')
            .split(',')
            .map(function (item) { return item.trim(); })
            .filter(Boolean);

        keys.forEach(function (key) {
            var selector = '[data-menu-key="' + key.replace(/"/g, '\\"') + '"]';
            var link = document.querySelector(selector);
            if (link) {
                link.classList.add('active');
            }
        });

    }

    function renderMenu(container, templateMarkup, root) {
        var menuMarkup = templateMarkup.replace(/\{\{ROOT\}\}/g, root || '.');
        container.innerHTML = menuMarkup;
        setActiveLinks();
    }

    function templateFromHtml(html, variant) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(html, 'text/html');
        var template = doc.querySelector('template[data-menu-template="' + variant + '"]')
            || doc.querySelector('template[data-menu-template="default"]');
        return template ? template.innerHTML : '';
    }

    function loadMenu() {
        var body = document.body;
        var container = document.getElementById('site-menu');
        if (!body || !container) return;

        var root = resolveRoot(body.getAttribute('data-menu-root'));
        var variant = body.getAttribute('data-menu-variant') || 'default';
        var menuUrl = root ? root + '/partials/menu.html' : 'partials/menu.html';
        var fallbackTemplate = fallbackTemplates[variant] || fallbackTemplates["default"];

        fetch(menuUrl)
            .then(function (response) {
                if (!response.ok) {
                    throw new Error('Menu include failed: ' + response.status);
                }
                return response.text();
            })
            .then(function (html) {
                var templateMarkup = templateFromHtml(html, variant);
                if (!templateMarkup) {
                    throw new Error('Menu template not found');
                }
                renderMenu(container, templateMarkup, root);
            })
            .catch(function (error) {
                console.warn(error);
                renderMenu(container, fallbackTemplate, root);
            });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadMenu);
    } else {
        loadMenu();
    }
})();
