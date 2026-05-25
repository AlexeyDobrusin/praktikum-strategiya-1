/* ============================================
   Traffic source — save UTM params & referrer, append to Prodamus link
   ============================================ */
(function() {
    // Save UTM on first visit
    if (!sessionStorage.getItem('traffic_source')) {
        var params = new URLSearchParams(window.location.search);
        var source = {
            utm_source: params.get('utm_source') || '',
            utm_medium: params.get('utm_medium') || '',
            utm_campaign: params.get('utm_campaign') || '',
            referrer: document.referrer || ''
        };
        sessionStorage.setItem('traffic_source', JSON.stringify(source));
    }

    // Append UTM to Prodamus payment links on click
    document.addEventListener('click', function(e) {
        var link = e.target.closest('a[href*="payform.ru"]');
        if (!link) return;

        var trafficSource = {};
        try {
            trafficSource = JSON.parse(sessionStorage.getItem('traffic_source') || '{}');
        } catch(err) {}

        var url = new URL(link.href);
        if (trafficSource.utm_source) url.searchParams.set('utm_source', trafficSource.utm_source);
        if (trafficSource.utm_medium) url.searchParams.set('utm_medium', trafficSource.utm_medium);
        if (trafficSource.utm_campaign) url.searchParams.set('utm_campaign', trafficSource.utm_campaign);
        if (trafficSource.referrer) url.searchParams.set('referrer', trafficSource.referrer);
        link.href = url.toString();
    });
})();

/* ============================================
   Hero Card — Tilt effect on mouse move
   ============================================ */
(function() {
    const card = document.querySelector('.hero-card');
    if (!card) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    card.addEventListener('mousemove', function(e) {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -4;
        const rotateY = ((x - centerX) / centerX) * 4;

        card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    card.addEventListener('mouseleave', function() {
        card.style.transform = 'rotate(-2deg)';
    });
})();

/* ============================================
   Counter animation — count up with formatting
   ============================================ */
(function() {
    var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    document.querySelectorAll('.counter').forEach(function(el) {
        var target = parseInt(el.dataset.target, 10);
        if (isNaN(target)) return;

        if (prefersReduced) {
            el.textContent = target;
            return;
        }

        el.textContent = '0';
        var pause = 2000;
        var stepDelay = 1000;

        function pulse() {
            el.style.transform = 'scale(1.3)';
            el.style.color = '#1a1a2e';
            setTimeout(function() {
                el.style.transform = 'scale(1)';
                el.style.color = '';
            }, 300);
        }

        function runCycle() {
            var current = 0;
            el.textContent = '0';

            function tick() {
                current++;
                el.textContent = current;
                pulse();
                if (current < target) {
                    setTimeout(tick, stepDelay);
                } else {
                    setTimeout(function() {
                        el.textContent = '0';
                        el.style.color = '';
                        runCycle();
                    }, pause);
                }
            }

            setTimeout(tick, stepDelay);
        }

        var observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    runCycle();
                    observer.disconnect();
                }
            });
        }, { threshold: 0.5 });

        observer.observe(el);
    });
})();

/* ============================================
   Scanner — drag & reveal logic
   ============================================ */
(function() {
    var scanLine = document.querySelector('.scan-line');
    var grid = document.querySelector('.scanner-wrap .grid');
    if (!scanLine || !grid) return;

    var cells = grid.querySelectorAll('.cell');
    var isDragging = false;

    function getVisibleMaxY() {
        var gridRect = grid.getBoundingClientRect();
        var maxBottom = 0;
        cells.forEach(function(cell) {
            if (cell.offsetParent === null) return; // hidden via display:none
            var r = cell.getBoundingClientRect();
            var bottom = r.bottom - gridRect.top;
            if (bottom > maxBottom) maxBottom = bottom;
        });
        return maxBottom || gridRect.height;
    }

    function updateCells() {
        var lineRect = scanLine.getBoundingClientRect();
        var lineY = lineRect.top + lineRect.height / 2;

        cells.forEach(function(cell) {
            if (cell.offsetParent === null) return;
            var cellRect = cell.getBoundingClientRect();
            var whiteLayer = cell.querySelector('.cell-white');
            var cellTop = cellRect.top;
            var cellBottom = cellRect.bottom;
            var cellHeight = cellRect.height;

            if (lineY <= cellTop) {
                whiteLayer.style.clipPath = 'inset(0 0 100% 0)';
            } else if (lineY >= cellBottom) {
                whiteLayer.style.clipPath = 'inset(0 0 0 0)';
            } else {
                var pct = ((lineY - cellTop) / cellHeight) * 100;
                whiteLayer.style.clipPath = 'inset(0 0 ' + (100 - pct) + '% 0)';
            }

            if (cell.hasAttribute('data-sick')) {
                if (lineY >= cellBottom) {
                    cell.classList.add('sick-active');
                } else {
                    cell.classList.remove('sick-active');
                }
            }
        });
    }

    var animObserver = setInterval(function() { updateCells(); }, 30);
    setTimeout(function() { clearInterval(animObserver); }, 7000);

    scanLine.addEventListener('mousedown', function(e) {
        e.preventDefault();
        var currentTop = scanLine.getBoundingClientRect().top - grid.getBoundingClientRect().top;
        scanLine.style.animation = 'none';
        scanLine.style.top = currentTop + 'px';
        isDragging = true;
        scanLine.classList.add('dragging');
    });

    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        var rect = grid.getBoundingClientRect();
        var y = e.clientY - rect.top;
        var maxY = getVisibleMaxY();
        y = Math.max(0, Math.min(y, maxY));
        scanLine.style.top = y + 'px';
        updateCells();
    });

    document.addEventListener('mouseup', function() {
        if (!isDragging) return;
        isDragging = false;
        scanLine.classList.remove('dragging');
    });

    scanLine.addEventListener('touchstart', function(e) {
        e.preventDefault();
        var currentTop = scanLine.getBoundingClientRect().top - grid.getBoundingClientRect().top;
        scanLine.style.animation = 'none';
        scanLine.style.top = currentTop + 'px';
        isDragging = true;
        scanLine.classList.add('dragging');
    }, { passive: false });

    document.addEventListener('touchmove', function(e) {
        if (!isDragging) return;
        e.preventDefault();
        var touch = e.touches[0];
        var rect = grid.getBoundingClientRect();
        var y = touch.clientY - rect.top;
        var maxY = getVisibleMaxY();
        y = Math.max(0, Math.min(y, maxY));
        scanLine.style.top = y + 'px';
        updateCells();
    }, { passive: false });

    document.addEventListener('touchend', function() {
        if (!isDragging) return;
        isDragging = false;
        scanLine.classList.remove('dragging');
    });
})();

/* ============================================
   Typography — prevent orphan prepositions
   Заменяет пробел после коротких слов на неразрывный
   ============================================ */
(function() {
    // Союзы, предлоги, частицы (1-3 буквы)
    var shortWords = [
        'и', 'а', 'но', 'да', 'или', 'ли', 'же', 'бы', 'ни', 'не', 'то',
        'в', 'на', 'к', 'с', 'у', 'о', 'по', 'за', 'из', 'от', 'до', 'со', 'об', 'ко', 'во', 'при', 'без', 'над', 'под', 'про', 'для',
        'я', 'мы', 'вы', 'он', 'её', 'его', 'их', 'как', 'что', 'все', 'это', 'при', 'уже', 'ещё', 'чем', 'кто'
    ];

    // Регулярка: слово из списка + пробел (с учётом регистра)
    var pattern = new RegExp('(^|[\\s>«"\\(])(' + shortWords.join('|') + ')(\\s)', 'gi');

    function fixOrphans(text) {
        // Неразрывный пробел после коротких слов
        text = text.replace(pattern, function(match, before, word, space) {
            return before + word + '\u00A0';
        });
        // Неразрывный пробел перед ₽ (валютой)
        text = text.replace(/(\d)\s*(₽)/g, '$1\u00A0$2');
        // Неразрывный пробел в числах с пробелами (1 000, 3 000)
        text = text.replace(/(\d)\s+(\d{3})/g, '$1\u00A0$2');
        return text;
    }

    function processNode(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            var fixed = fixOrphans(node.textContent);
            if (fixed !== node.textContent) {
                node.textContent = fixed;
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            // Пропускаем script, style, textarea, input
            var tag = node.tagName.toLowerCase();
            if (tag === 'script' || tag === 'style' || tag === 'textarea' || tag === 'input' || tag === 'code' || tag === 'pre') {
                return;
            }
            node.childNodes.forEach(processNode);
        }
    }

    // Применяем к основному контенту
    function applyTypography() {
        var selectors = [
            '.hero-left',
            '.section-header',
            '.card',
            '.quote-text',
            '.author-bio',
            '.offer-card',
            '.footer'
        ];

        selectors.forEach(function(sel) {
            document.querySelectorAll(sel).forEach(processNode);
        });

        // Также обрабатываем все p, h1-h6, span, li
        document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, span, a').forEach(processNode);
    }

    // Запускаем после загрузки DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyTypography);
    } else {
        applyTypography();
    }
})();

/* ============================================
   Video Modal — open/close logic
   ============================================ */
(function() {
    function initVideoModal() {
        var modal = document.getElementById('videoModal');
        var closeBtn = document.getElementById('videoModalClose');
        var overlay = modal ? modal.querySelector('.video-modal-overlay') : null;
        var previewBtn = document.querySelector('.btn-secondary');

        var kinescopeIframe = document.getElementById('kinescope-player');
        var videoPlayBtn = document.getElementById('videoPlayBtn');
        var videoPreview = document.getElementById('videoPreview');
        var videoSpinner = document.getElementById('videoSpinner');
        var videoSrc = 'https://kinescope.io/embed/32Sr96tPBbNWfi84tcoTPG';
        var hideTimer = null;

        if (!modal || !previewBtn) return;

        function startVideo() {
            if (videoPlayBtn) videoPlayBtn.style.display = 'none';
            if (videoSpinner) videoSpinner.style.display = 'block';
            if (kinescopeIframe) {
                kinescopeIframe.onload = function() {
                    hideTimer = setTimeout(function() {
                        if (videoPreview) videoPreview.classList.add('hidden');
                        if (videoSpinner) videoSpinner.style.display = 'none';
                    }, 600);
                };
                kinescopeIframe.src = videoSrc + '?autoplay=1';
            }
        }

        function resetVideo() {
            if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
            if (kinescopeIframe) {
                kinescopeIframe.onload = null;
                kinescopeIframe.src = '';
            }
            if (videoPreview) videoPreview.classList.remove('hidden');
            if (videoPlayBtn) videoPlayBtn.style.display = '';
            if (videoSpinner) videoSpinner.style.display = 'none';
        }

        function openModal(e) {
            e.preventDefault();
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function closeModal() {
            modal.classList.remove('active');
            document.body.style.overflow = '';
            resetVideo();
        }

        if (videoPlayBtn) {
            videoPlayBtn.addEventListener('click', startVideo);
            videoPlayBtn.addEventListener('touchend', function(e) {
                e.preventDefault();
                startVideo();
            });
        }

        previewBtn.addEventListener('click', openModal);

        // Для мобильных устройств
        previewBtn.addEventListener('touchend', function(e) {
            e.preventDefault();
            openModal(e);
        });

        if (closeBtn) {
            closeBtn.addEventListener('click', closeModal);
            closeBtn.addEventListener('touchend', function(e) {
                e.preventDefault();
                closeModal();
            });
        }

        if (overlay) {
            overlay.addEventListener('click', closeModal);
            overlay.addEventListener('touchend', function(e) {
                e.preventDefault();
                closeModal();
            });
        }

        // Закрытие по Escape
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                closeModal();
            }
        });
    }

    // Запускаем после загрузки DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initVideoModal);
    } else {
        initVideoModal();
    }
})();
