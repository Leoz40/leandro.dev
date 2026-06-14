(function () {
  'use strict';

  document.getElementById('current-year').textContent = new Date().getFullYear();

  function isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  function debounce(fn, ms) {
    var timer = null;
    return function () {
      var ctx = this, args = arguments;
      if (timer) clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(ctx, args); timer = null; }, ms);
    };
  }

  function onVisible(el, callback) {
    if (!el) return;
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          callback(e.target);
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.2 });
    obs.observe(el);
  }

  ParticlesBackground();
  initNavigation();
  initSkillBars();
  initTimeline();
  initCounters();
  initContactForm();
  initBackToTop();
  initSmoothScroll();
  initActiveSection();
  initAOS();

  function ParticlesBackground() {
    var canvas = document.getElementById('particles-canvas');
    if (!canvas) return;
    var ctx = null;
    try { ctx = canvas.getContext('2d'); } catch (e) { return; }
    if (!ctx) return;
    var particles = [];
    var w, h;
    var running = true;

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      if (w === 0 || h === 0) return;
      canvas.width = w;
      canvas.height = h;
    }
    resize();
    window.addEventListener('resize', debounce(resize, 200));

    var count = Math.min(Math.floor(Math.max(w, 1) * Math.max(h, 1) / 12000), 80);
    for (var i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        r: Math.random() * 2 + 0.5,
        o: Math.random() * 0.5 + 0.1,
      });
    }

    function animate() {
      if (!running) return;
      if (w === 0 || h === 0) { requestAnimationFrame(animate); return; }
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,' + p.o + ')';
        ctx.fill();

        for (var j = i + 1; j < particles.length; j++) {
          var p2 = particles[j];
          var dx = p.x - p2.x;
          var dy = p.y - p2.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = 'rgba(255,255,255,' + (0.08 * (1 - dist / 120)) + ')';
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(animate);
    }
    animate();
  }

  function initNavigation() {
    var navbar = document.getElementById('navbar');
    var menuBtn = document.getElementById('mobile-menu-btn');
    var mobileMenu = document.getElementById('mobile-menu');
    var menuOpen = document.getElementById('menu-icon-open');
    var menuClose = document.getElementById('menu-icon-close');

    window.addEventListener('scroll', debounce(function () {
      if (window.scrollY > 50) {
        navbar.classList.add('navbar-scrolled');
      } else {
        navbar.classList.remove('navbar-scrolled');
      }
    }, 10));

    if (menuBtn && mobileMenu) {
      menuBtn.addEventListener('click', function () {
        var isOpen = !mobileMenu.classList.contains('hidden');
        mobileMenu.classList.toggle('hidden');
        menuBtn.setAttribute('aria-expanded', !isOpen);
        menuOpen.classList.toggle('hidden');
        menuClose.classList.toggle('hidden');
      });

      mobileMenu.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () {
          mobileMenu.classList.add('hidden');
          menuBtn.setAttribute('aria-expanded', 'false');
          menuOpen.classList.remove('hidden');
          menuClose.classList.add('hidden');
        });
      });
    }
  }

  function initSkillBars() {
    var bars = document.querySelectorAll('.skill-progress');
    bars.forEach(function (bar) {
      var card = bar.closest('.skill-card');
      if (!card) return;
      var w = bar.getAttribute('data-width');
      if (!w) return;
      bar.style.setProperty('--target-width', w + '%');
      onVisible(card, function () {
        card.classList.add('visible');
        setTimeout(function () { bar.style.width = w + '%'; }, 200);
      });
    });
  }

  function initTimeline() {
    var items = document.querySelectorAll('.timeline-item');
    items.forEach(function (item) {
      onVisible(item, function (el) { el.classList.add('visible'); });
    });
  }

  function initCounters() {
    var counters = document.querySelectorAll('.counter-value');
    counters.forEach(function (counter) {
      onVisible(counter, function (el) {
        var target = parseInt(el.getAttribute('data-target'), 10);
        if (isNaN(target)) return;
        var current = 0;
        var increment = Math.ceil(target / 60);
        var timer = setInterval(function () {
          current += increment;
          if (current >= target) { current = target; clearInterval(timer); }
          el.textContent = current;
        }, 25);
      });
    });
  }

  function initContactForm() {
    var form = document.getElementById('contact-form');
    if (!form) return;

    var nameInput = document.getElementById('name');
    var emailInput = document.getElementById('email');
    var messageInput = document.getElementById('message');
    var submitBtn = document.getElementById('submit-btn');
    var submitText = document.getElementById('submit-text');
    var submitSpinner = document.getElementById('submit-spinner');
    var feedback = document.getElementById('form-feedback');

    function showError(input, show) {
      var err = input.parentElement.querySelector('.form-error');
      if (err) err.classList.toggle('hidden', !show);
      input.classList.toggle('error', show);
    }

    function validateField(input) {
      var valid = true;
      if (input.id === 'name') { valid = input.value.trim().length > 0; }
      if (input.id === 'email') { valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim()); }
      if (input.id === 'message') { valid = input.value.trim().length > 0; }
      showError(input, !valid);
      return valid;
    }

    [nameInput, emailInput, messageInput].forEach(function (input) {
      if (!input) return;
      input.addEventListener('blur', function () { if (this.value) validateField(this); });
      input.addEventListener('input', function () {
        var err = this.parentElement.querySelector('.form-error');
        if (err && !err.classList.contains('hidden')) validateField(this);
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      feedback.className = 'hidden text-center text-sm py-3 px-4 rounded-xl';

      var valid = true;
      [nameInput, emailInput, messageInput].forEach(function (input) {
        if (!input) return;
        if (!validateField(input)) valid = false;
      });
      if (!valid) return;

      submitBtn.disabled = true;
      submitText.textContent = 'Enviando...';
      submitSpinner.classList.remove('hidden');

      var payload = {
        name: nameInput.value.trim().replace(/[<>"'\/]/g, ''),
        email: emailInput.value.trim().replace(/[<>"'\/]/g, ''),
        message: messageInput.value.trim().replace(/[<>"'\/]/g, ''),
      };

      fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.success) {
            feedback.className = 'text-center text-sm py-3 px-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400';
            feedback.textContent = data.message;
            form.reset();
          } else {
            feedback.className = 'text-center text-sm py-3 px-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400';
            feedback.textContent = data.error || 'Erro ao enviar mensagem.';
          }
          feedback.classList.remove('hidden');
        })
        .catch(function () {
          feedback.className = 'text-center text-sm py-3 px-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400';
          feedback.textContent = 'Erro de conexao. Tente novamente.';
          feedback.classList.remove('hidden');
        })
        .finally(function () {
          submitBtn.disabled = false;
          submitText.textContent = 'Enviar Mensagem';
          submitSpinner.classList.add('hidden');
        });
    });
  }

  function initBackToTop() {
    var btn = document.getElementById('back-to-top');
    if (!btn) return;
    window.addEventListener('scroll', debounce(function () {
      btn.classList.toggle('visible', window.scrollY > 400);
    }, 100));
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var target = document.querySelector(this.getAttribute('href'));
        if (target) {
          e.preventDefault();
          var offset = 80;
          if (isTouchDevice()) offset = 70;
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          window.scrollBy(0, -offset);
        }
      });
    });
  }

  function initActiveSection() {
    var sections = document.querySelectorAll('section[id]');
    var links = document.querySelectorAll('.nav-link[href^="#"]');
    if (!sections.length || !links.length) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          links.forEach(function (link) {
            link.style.color = link.getAttribute('href') === '#' + entry.target.id ? '#fff' : '#9ca3af';
          });
        }
      });
    }, { threshold: 0.3, rootMargin: '-80px 0px 0px 0px' });

    sections.forEach(function (s) { observer.observe(s); });
  }

  function initAOS() {
    if (typeof AOS !== 'undefined') {
      AOS.init({
        duration: 800,
        once: true,
        offset: 80,
        disable: window.innerWidth < 640 ? 'mobile' : false,
      });
    }
  }

  if (isTouchDevice()) {
    document.addEventListener('touchstart', function () {}, { passive: true });
  }

})();
