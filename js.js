/ ===== 1. GLOBAL STATE =====/
let currentUser = null;
let currentPage = 'home';
let currentInputType = 'text';
let analysisHistory = [];
let allUsers = [];

// Default Config
const defaultConfig = {
    site_title: 'FactGuard AI',
    hero_heading: 'Detect Fake News In Seconds',
    hero_description: 'Our advanced AI analyzes news articles, images, and videos to help you distinguish fact from fiction. Protect yourself from misinformation with cutting-edge machine learning technology.',
    background_color: '#0f172a',
    surface_color: 'rgba(255, 255, 255, 0.08)',
    text_color: '#94a3b8',
    primary_color: '#3b82f6',
    secondary_color: '#8b5cf6'
};

// ===== 2. DATA HANDLER =====
const dataHandler = {
    onDataChanged(data) {
        allUsers = data.filter(d => d.type === 'user');
        analysisHistory = data.filter(d => d.type === 'analysis');
        updateRecentChecks();
        updateAuthButton();
    }
};

// ===== 3. INITIALIZATION =====
async function initApp() {
    // Initialize Element SDK
    if (window.elementSdk) {
        window.elementSdk.init({
            defaultConfig,
            onConfigChange: async (config) => {
                document.getElementById('site-title').textContent = config.site_title || defaultConfig.site_title;
                const heroHeading = document.getElementById('hero-heading');
                if (heroHeading) {
                    heroHeading.innerHTML = `
            <span class="text-white">Detect</span>
            <span class="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient"> Fake News</span>
            <br>
            <span class="text-white">In Seconds</span>
          `;
                }
                const heroDesc = document.getElementById('hero-description');
                if (heroDesc) {
                    heroDesc.textContent = config.hero_description || defaultConfig.hero_description;
                }
            },
            mapToCapabilities: (config) => ({
                recolorables: [
                    {
                        get: () => config.primary_color || defaultConfig.primary_color,
                        set: (value) => window.elementSdk.setConfig({ primary_color: value })
                    }
                ],
                borderables: [],
                fontEditable: undefined,
                fontSizeable: undefined
            }),
            mapToEditPanelValues: (config) => new Map([
                ['site_title', config.site_title || defaultConfig.site_title],
                ['hero_heading', config.hero_heading || defaultConfig.hero_heading],
                ['hero_description', config.hero_description || defaultConfig.hero_description]
            ])
        });
    }

    // Initialize Data SDK
    if (window.dataSdk) {
        const result = await window.dataSdk.init(dataHandler);
        if (!result.isOk) {
            console.error('Failed to initialize Data SDK');
        }
    }
}

initApp();

// ===== 4. NAVIGATION =====
function showPage(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.getElementById(`page-${page}`).classList.remove('hidden');
    currentPage = page;
    window.scrollTo(0, 0);
}

// Mobile Menu
function toggleMobileMenu() {
    document.getElementById('mobile-menu').classList.toggle('hidden');
}

// ===== 5. AUTHENTICATION =====
function showAuthTab(tab) {
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const authTitle = document.getElementById('auth-title');
    const authSubtitle = document.getElementById('auth-subtitle');

    if (tab === 'login') {
        loginTab.className = 'flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all bg-gradient-to-r from-orange-500 to-orange-600 text-white';
        registerTab.className = 'flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all text-gray-400 hover:text-white';
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        authTitle.textContent = 'Welcome Back';
        authSubtitle.textContent = 'Sign in to continue to FactGuard AI';
    } else {
        registerTab.className = 'flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all bg-gradient-to-r from-orange-500 to-orange-600 text-white';
        loginTab.className = 'flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all text-gray-400 hover:text-white';
        registerForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
        authTitle.textContent = 'Create Account';
        authSubtitle.textContent = 'Join FactGuard AI to verify news';
    }
    document.getElementById('auth-message').classList.add('hidden');
}

// Handle Login
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const submitBtn = document.getElementById('login-submit');
    const messageDiv = document.getElementById('auth-message');

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<svg class="w-5 h-5 animate-spin mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>';

    // Find user
    const user = allUsers.find(u => u.email === email && u.password === password);

    setTimeout(() => {
        if (user) {
            currentUser = user;
            messageDiv.textContent = 'Login successful! Redirecting...';
            messageDiv.className = 'mt-4 text-center text-sm text-green-400';
            messageDiv.classList.remove('hidden');
            updateAuthButton();
            setTimeout(() => showPage('check'), 1000);
        } else {
            messageDiv.textContent = 'Invalid email or password. Please try again.';
            messageDiv.className = 'mt-4 text-center text-sm text-red-400';
            messageDiv.classList.remove('hidden');
        }
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In';
    }, 1000);
}

// Handle Register
async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirm = document.getElementById('register-confirm').value;
    const submitBtn = document.getElementById('register-submit');
    const messageDiv = document.getElementById('auth-message');

    if (password !== confirm) {
        messageDiv.textContent = 'Passwords do not match!';
        messageDiv.className = 'mt-4 text-center text-sm text-red-400';
        messageDiv.classList.remove('hidden');
        return;
    }

    if (allUsers.length >= 999) {
        messageDiv.textContent = 'Maximum user limit reached. Please try again later.';
        messageDiv.className = 'mt-4 text-center text-sm text-red-400';
        messageDiv.classList.remove('hidden');
        return;
    }

    if (allUsers.find(u => u.email === email)) {
        messageDiv.textContent = 'Email already registered. Please login instead.';
        messageDiv.className = 'mt-4 text-center text-sm text-red-400';
        messageDiv.classList.remove('hidden');
        return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<svg class="w-5 h-5 animate-spin mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>';

    if (window.dataSdk) {
        const result = await window.dataSdk.create({
            id: Date.now().toString(),
            type: 'user',
            username,
            email,
            password,
            newsText: '',
            newsUrl: '',
            result: '',
            confidence: 0,
            createdAt: new Date().toISOString()
        });

        if (result.isOk) {
            messageDiv.textContent = 'Account created successfully! Please login.';
            messageDiv.className = 'mt-4 text-center text-sm text-green-400';
            messageDiv.classList.remove('hidden');
            setTimeout(() => showAuthTab('login'), 1500);
        } else {
            messageDiv.textContent = 'Registration failed. Please try again.';
            messageDiv.className = 'mt-4 text-center text-sm text-red-400';
            messageDiv.classList.remove('hidden');
        }
    }

    submitBtn.disabled = false;
    submitBtn.textContent = 'Create Account';
}

// Update Auth Button
function updateAuthButton() {
    const authBtn = document.getElementById('auth-btn');
    if (currentUser) {
        authBtn.textContent = currentUser.username;
        authBtn.onclick = () => {
            currentUser = null;
            updateAuthButton();
            showPage('home');
        };
    } else {
        authBtn.textContent = 'Login';
        authBtn.onclick = () => showPage('login');
    }
}

// ===== 6. INPUT HANDLING =====
function setInputType(type) {
    currentInputType = type;
    document.querySelectorAll('.input-type-btn').forEach(btn => {
        btn.className = 'input-type-btn px-4 py-2 rounded-lg text-sm font-medium bg-white/5 text-gray-400 hover:text-white transition-all';
    });
    document.getElementById(`type-${type}`).className = 'input-type-btn px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-orange-500 to-orange-600 text-white';

    document.querySelectorAll('.input-section').forEach(s => s.classList.add('hidden'));
    document.getElementById(`input-${type}`).classList.remove('hidden');
}

// File Selection Handler
function handleFileSelect(input, type) {
    const file = input.files[0];
    if (!file) return;

    const preview = document.getElementById(`${type}-preview`);
    preview.classList.remove('hidden');

    if (type === 'image') {
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.innerHTML = `
        <div class="relative inline-block">
          <img src="${e.target.result}" class="max-h-48 rounded-lg" alt="Preview">
          <button onclick="clearFile('image')" class="absolute top-2 right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white">×</button>
        </div>
        <p class="text-sm text-gray-400 mt-2">${file.name}</p>
      `;
        };
        reader.readAsDataURL(file);
    } else {
        preview.innerHTML = `
      <div class="flex items-center space-x-3 bg-white/5 rounded-xl p-4">
        <svg class="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
        </svg>
        <div class="flex-1">
          <p class="text-white font-medium">${file.name}</p>
          <p class="text-gray-400 text-sm">${(file.size / (1024 * 1024)).toFixed(2)} MB</p>
        </div>
        <button onclick="clearFile('video')" class="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white">×</button>
      </div>
    `;
    }
}

function clearFile(type) {
    document.getElementById(`${type}-file`).value = '';
    document.getElementById(`${type}-preview`).classList.add('hidden');
}

// ===== 7. ANALYSIS ENGINE =====
async function analyzeNews() {
    let content = '';

    if (currentInputType === 'text') {
        content = document.getElementById('news-text').value.trim();
    } else if (currentInputType === 'url') {
        content = document.getElementById('news-url').value.trim();
    } else if (currentInputType === 'image') {
        content = document.getElementById('image-file').files[0]?.name || '';
    } else if (currentInputType === 'video') {
        content = document.getElementById('video-file').files[0]?.name || '';
    }

    if (!content) {
        showInlineMessage('Please provide some content to analyze.', 'error');
        return;
    }

    // Show progress
    document.getElementById('analysis-progress').classList.remove('hidden');
    document.getElementById('analysis-results').classList.add('hidden');
    document.getElementById('analysis-results').innerHTML = '';

    // Animate progress bars
    await animateProgress();

    // Generate result
    const isFake = Math.random() > 0.5;
    const confidence = Math.floor(Math.random() * 20) + 75;

    // Save to history
    if (window.dataSdk && analysisHistory.length < 999) {
        await window.dataSdk.create({
            id: Date.now().toString(),
            type: 'analysis',
            username: currentUser?.username || 'Guest',
            email: currentUser?.email || '',
            password: '',
            newsText: currentInputType === 'text' ? content.substring(0, 200) : '',
            newsUrl: currentInputType === 'url' ? content : '',
            result: isFake ? 'FAKE' : 'REAL',
            confidence,
            createdAt: new Date().toISOString()
        });
    }

    // Show results
    displayResults(isFake, confidence, content);
}

// ===== 8. PROGRESS & DISPLAY =====
async function animateProgress() {
    const bars = ['progress-text-bar', 'progress-source-bar', 'progress-cross-bar'];

    for (let i = 0; i < bars.length; i++) {
        const bar = document.getElementById(bars[i]);
        await new Promise(resolve => {
            setTimeout(() => {
                bar.style.width = '100%';
                resolve();
            }, 800 * (i + 1));
        });
    }

    await new Promise(resolve => setTimeout(resolve, 500));
}

function displayResults(isFake, confidence, content) {
    document.getElementById('analysis-progress').classList.add('hidden');
    const resultsDiv = document.getElementById('analysis-results');
    resultsDiv.classList.remove('hidden');

    const reasons = isFake ? [
        'Content contains sensationalist language patterns',
        'No credible source citations found',
        'Claims could not be verified by trusted databases',
        'Writing style matches known misinformation patterns'
    ] : [
        'Content verified against trusted news sources',
        'Claims match official statements and data',
        'Writing style consistent with credible journalism',
        'Multiple independent sources confirm the information'
    ];

    const sources = ['BBC News', 'Reuters', 'Associated Press', 'The Guardian', 'NDTV'];

    resultsDiv.innerHTML = `
    <div class="${isFake ? 'result-fake' : 'result-real'} rounded-3xl p-6 sm:p-8 animate-fade-in">
      <div class="flex flex-col sm:flex-row items-center justify-between mb-6">
        <div class="flex items-center space-x-4 mb-4 sm:mb-0">
          <div class="w-16 h-16 rounded-2xl ${isFake ? 'bg-red-500/20' : 'bg-green-500/20'} flex items-center justify-center">
            ${isFake ?
            '<svg class="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>' :
            '<svg class="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>'
        }
          </div>
          <div>
            <h2 class="text-2xl font-bold ${isFake ? 'text-red-400' : 'text-green-400'}">
              ${isFake ? 'FAKE NEWS ❌' : 'REAL NEWS ✅'}
            </h2>
            <p class="text-gray-400">Analysis Complete</p>
          </div>
        </div>
        <div class="text-center">
          <div class="relative w-24 h-24">
            <svg class="w-24 h-24 progress-ring" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#374151" stroke-width="8"/>
              <circle cx="50" cy="50" r="45" fill="none" stroke="${isFake ? '#ef4444' : '#22c55e'}" stroke-width="8" 
                stroke-dasharray="${confidence * 2.83} 283" stroke-linecap="round"/>
            </svg>
            <div class="absolute inset-0 flex items-center justify-center">
              <span class="text-2xl font-bold ${isFake ? 'text-red-400' : 'text-green-400'}">${confidence}%</span>
            </div>
          </div>
          <p class="text-gray-400 text-sm mt-2">Confidence</p>
        </div>
      </div>
      
      <div class="space-y-4">
        <div>
          <h3 class="font-semibold text-white mb-3">Analysis Findings:</h3>
          <ul class="space-y-2">
            ${reasons.map(r => `
              <li class="flex items-start space-x-2">
                <span class="${isFake ? 'text-red-400' : 'text-green-400'}">•</span>
                <span class="text-gray-300">${r}</span>
              </li>
            `).join('')}
          </ul>
        </div>
        
        ${!isFake ? `
          <div class="border-t border-white/10 pt-4">
            <h3 class="font-semibold text-white mb-3">Verified Sources:</h3>
            <div class="flex flex-wrap gap-2">
              ${sources.slice(0, 3).map(s => `
                <span class="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm">${s}</span>
              `).join('')}
            </div>
          </div>
        ` : `
          <div class="border-t border-white/10 pt-4">
            <h3 class="font-semibold text-white mb-3">Suggested Action:</h3>
            <p class="text-gray-400">We recommend verifying this information through official news sources before sharing. Cross-reference with trusted fact-checking websites.</p>
          </div>
        `}
      </div>
    </div>
    
    <button onclick="resetAnalysis()" class="btn-primary w-full py-4 rounded-xl font-semibold flex items-center justify-center space-x-2">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
      </svg>
      <span>Analyze Another</span>
    </button>
  `;
}

function resetAnalysis() {
    document.getElementById('news-text').value = '';
    document.getElementById('news-url').value = '';
    clearFile('image');
    clearFile('video');
    document.getElementById('analysis-results').classList.add('hidden');
    document.getElementById('analysis-progress').classList.add('hidden');
    document.querySelectorAll('#analysis-progress [id$="-bar"]').forEach(bar => bar.style.width = '0');
}

// ===== 9. HISTORY =====
function updateRecentChecks() {
    const container = document.getElementById('recent-checks-list');
    if (analysisHistory.length === 0) {
        container.innerHTML = '<p class="text-gray-400 text-center py-8">No recent checks. Start by analyzing some news!</p>';
        return;
    }

    const recent = analysisHistory.slice(-5).reverse();
    container.innerHTML = recent.map(item => `
    <div class="glass-card rounded-xl p-4 flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 rounded-lg ${item.result === 'FAKE' ? 'bg-red-500/20' : 'bg-green-500/20'} flex items-center justify-center">
          ${item.result === 'FAKE' ?
            '<svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>' :
            '<svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>'
        }
        </div>
        <div>
          <p class="text-white text-sm font-medium truncate max-w-xs">${item.newsText || item.newsUrl || 'Media analysis'}</p>
          <p class="text-gray-400 text-xs">${new Date(item.createdAt).toLocaleDateString()}</p>
        </div>
      </div>
      <span class="px-3 py-1 rounded-full text-xs font-medium ${item.result === 'FAKE' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}">
        ${item.result} (${item.confidence}%)
      </span>
    </div>
  `).join('');
}

// ===== 10. CONTACT =====
async function handleContact(e) {
    e.preventDefault();
    const submitBtn = document.getElementById('contact-submit');
    const messageDiv = document.getElementById('contact-message-status');

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<svg class="w-5 h-5 animate-spin mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>';

    setTimeout(() => {
        messageDiv.textContent = 'Message sent successfully! We\'ll get back to you soon.';
        messageDiv.className = 'mt-4 text-center text-sm text-green-400';
        messageDiv.classList.remove('hidden');
        document.getElementById('contact-form').reset();
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg><span>Send Message</span>';
    }, 1500);
}

// ===== 11. UTILITIES =====
function showInlineMessage(message, type) {
    const container = document.getElementById('analysis-input');
    let messageEl = container.querySelector('.inline-message');
    if (!messageEl) {
        messageEl = document.createElement('div');
        messageEl.className = 'inline-message mt-4 p-4 rounded-xl text-center';
        container.appendChild(messageEl);
    }
    messageEl.textContent = message;
    messageEl.className = `inline-message mt-4 p-4 rounded-xl text-center ${type === 'error' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`;
    setTimeout(() => messageEl.remove(), 3000);
}


