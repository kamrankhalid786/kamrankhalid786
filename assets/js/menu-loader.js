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
            '                    <a href="{{ROOT}}/verofy.html" data-menu-key="verofy">Verofy</a>',
            '                    <a href="{{ROOT}}/proconvey.html" data-menu-key="proconvey">ProConvey</a>',
            '                </div>',
            '            </li>',
            '            <li><a href="{{ROOT}}/education.html" data-menu-key="education">Education</a></li>',
            // '            <li><a href="{{ROOT}}/recommendations.html" data-menu-key="recommendations">Recommendations</a></li>',
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
            '            <li><a href="{{ROOT}}/verofy.html" data-menu-key="verofy">Verofy</a></li>',
            '            <li><a href="{{ROOT}}/proconvey.html" data-menu-key="proconvey">ProConvey</a></li>',
            // '            <li><a href="{{ROOT}}/recommendations.html" data-menu-key="recommendations">Recommendations</a></li>',
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

    function createImageZoomModal() {
        var existing = document.getElementById('siteImageZoomModal');
        if (existing) return existing;

        var modal = document.createElement('div');
        modal.id = 'siteImageZoomModal';
        modal.className = 'image-zoom-modal';
        modal.setAttribute('aria-hidden', 'true');
        modal.innerHTML = [
            '<button type="button" class="image-zoom-close" aria-label="Close image preview">',
            '  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
            '</button>',
            '<figure class="image-zoom-figure">',
            '  <img class="image-zoom-modal-img" alt="">',
            '  <figcaption class="image-zoom-caption"></figcaption>',
            '</figure>'
        ].join('');
        document.body.appendChild(modal);
        return modal;
    }

    function initImageZoom() {
        if (document.body && document.body.getAttribute('data-image-zoom') === 'off') return;

        var modal = createImageZoomModal();
        var modalImg = modal.querySelector('.image-zoom-modal-img');
        var modalCaption = modal.querySelector('.image-zoom-caption');
        var closeBtn = modal.querySelector('.image-zoom-close');

        function openImage(img) {
            if (!img) return;
            var src = img.getAttribute('data-zoom-src') || img.currentSrc || img.src;
            if (!src) return;

            modalImg.src = src;
            modalImg.alt = img.alt || '';
            modalCaption.textContent = img.getAttribute('data-zoom-caption') || '';

            modal.classList.add('active');
            modal.setAttribute('aria-hidden', 'false');
            modal.setAttribute('data-open', 'true');
            document.body.classList.add('image-zoom-open');
        }

        function closeImage() {
            modal.classList.remove('active');
            modal.setAttribute('aria-hidden', 'true');
            modal.setAttribute('data-open', 'false');
            document.body.classList.remove('image-zoom-open');
            modalImg.removeAttribute('src');
            modalImg.removeAttribute('alt');
            modalCaption.textContent = '';
        }

        var selector = [
            'img.media-img',
            'img.media-img-large',
            '.workshop-media-card img',
            '.clean-diagram-card img'
        ].join(',');

        var images = Array.prototype.slice.call(document.querySelectorAll(selector)).filter(function (img) {
            if (img.getAttribute('data-no-zoom') === 'true') return false;
            if (img.closest('.workshop-media-embed')) return false;
            return true;
        });

        images.forEach(function (img) {
            if (img.getAttribute('data-zoom-bound') === 'true') return;
            img.setAttribute('data-zoom-bound', 'true');
            img.classList.add('zoomable-image');
            img.setAttribute('title', img.getAttribute('title') || 'Click to zoom');
            img.addEventListener('click', function (event) {
                event.preventDefault();
                openImage(img);
            });
        });

        if (closeBtn && !closeBtn.getAttribute('data-zoom-bound')) {
            closeBtn.setAttribute('data-zoom-bound', 'true');
            closeBtn.addEventListener('click', function () {
                closeImage();
            });
        }

        if (!modal.getAttribute('data-overlay-bound')) {
            modal.setAttribute('data-overlay-bound', 'true');
            modal.addEventListener('click', function (event) {
                if (event.target === modal) {
                    closeImage();
                }
            });
        }

        if (!document.body.getAttribute('data-zoom-key-bound')) {
            document.body.setAttribute('data-zoom-key-bound', 'true');
            document.addEventListener('keydown', function (event) {
                if (event.key === 'Escape' && modal.classList.contains('active')) {
                    closeImage();
                }
            });
        }
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
        initImageZoom();
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
        document.addEventListener('DOMContentLoaded', function () {
            loadMenu();
            initImageZoom();
        });
    } else {
        loadMenu();
        initImageZoom();
    }
})();
