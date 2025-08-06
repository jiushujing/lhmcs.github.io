document.addEventListener('DOMContentLoaded', () => {
    // This script should only run on app.html. If it's another page, do nothing.
    if (!document.getElementById('phone-container')) {
        return;
    }

    const dom = {
        // Main Screens
        homeScreen: document.getElementById('home-screen'),
        chatScreen: document.getElementById('chat-screen'),
        myDashboardScreen: document.getElementById('my-dashboard-screen'),

        // Sub Screens
        characterDetailScreen: document.getElementById('character-detail-screen'),
        characterEditScreen: document.getElementById('character-edit-screen'),
        profileSettingsScreen: document.getElementById('profile-settings-screen'),
        apiSettingsScreen: document.getElementById('api-settings-screen'),
        backgroundSettingsScreen: document.getElementById('background-settings-screen'),
        chatSettingsScreen: document.getElementById('chat-settings-screen'),

        // Space Screen (Home) Elements
        characterList: document.getElementById('character-list'),
        addCharacterBtn: document.getElementById('add-character-btn'),
        menuBtn: document.getElementById('menu-btn'),
        dropdownMenu: document.getElementById('dropdown-menu'),
        batchDeleteHeader: document.getElementById('batch-delete-header'),
        batchDeleteFooter: document.getElementById('batch-delete-footer'),
        deleteSelectedBtn: document.getElementById('delete-selected-btn'),
        cancelDeleteBtn: document.getElementById('cancel-delete-btn'),

        // Chat Screen Elements
        chatHistory: document.getElementById('chat-history'),
        chatForm: document.getElementById('chat-form'),
        chatInput: document.getElementById('chat-input'),
        manualBtn: document.getElementById('manual-btn'),
        chatSettingsBtn: document.getElementById('chat-settings-btn'),

        // Character Detail Screen
        detailAvatar: document.getElementById('detail-avatar'),
        detailName: document.getElementById('detail-name'),
        goToChatBtn: document.getElementById('go-to-chat-btn'),
        goToEditBtn: document.getElementById('go-to-edit-btn'),

        // Character Edit Screen
        characterEditForm: document.getElementById('character-edit-form'),
        editCharAvatar: document.getElementById('edit-char-avatar'),
        editCharAvatarUpload: document.getElementById('edit-char-avatar-upload'),
        editCharName: document.getElementById('edit-char-name'),
        editCharSubtitle: document.getElementById('edit-char-subtitle'),
        editCharSetting: document.getElementById('edit-char-setting'),
        deleteCharacterBtn: document.getElementById('delete-character-btn'),
        
        // My Dashboard
        iconGrid: document.getElementById('icon-grid'),
        dashboardProfilePic: document.getElementById('dashboard-profile-pic'),
        dashboardUserName: document.getElementById('dashboard-user-name'),
        iconProfile: document.getElementById('icon-profile'),
        iconApi: document.getElementById('icon-api'),
        iconBackground: document.getElementById('icon-background'),
        iconEntertainment: document.getElementById('icon-entertainment'),
        iconMusic: document.getElementById('icon-music'),
        iconSliders: document.getElementById('icon-sliders'),
        opacitySlider: document.getElementById('opacity-slider'),
        brightnessSlider: document.getElementById('brightness-slider'),

        // Profile & API Settings Elements
        userNameInput: document.getElementById('user-name'),
        userSettingInput: document.getElementById('user-setting'),
        profilePic: document.getElementById('profile-pic'),
        profilePicUpload: document.getElementById('profile-pic-upload'),
        apiSettingsForm: document.getElementById('api-settings-form'),
        apiUrlInput: document.getElementById('api-url'),
        apiKeyInput: document.getElementById('api-key'),
        modelSelect: document.getElementById('model-select'),
        fetchModelsButton: document.getElementById('fetch-models-button'),
        btnOpenAI: document.getElementById('btn-openai'),
        btnGemini: document.getElementById('btn-gemini'),
        openaiModelsGroup: document.getElementById('openai-models'),
        geminiModelsGroup: document.getElementById('gemini-models'),
    };

    let characters = [];
    let activeCharacterId = null;
    let isBatchDeleteMode = false;
    let currentApiType = 'openai';
    let currentView = 'space'; // 'chat', 'space', 'dashboard'

    // --- Data Management ---
    const saveCharacters = () => localStorage.setItem('aiChatCharacters', JSON.stringify(characters));
    const loadCharacters = () => {
        const saved = localStorage.getItem('aiChatCharacters');
        characters = saved ? JSON.parse(saved) : [{ id: Date.now(), name: 'Helpful Assistant', subtitle: 'Your default AI companion.', setting: 'You are a helpful assistant.', avatar: '', history: [] }];
        if (!saved) saveCharacters();
        activeCharacterId = parseInt(sessionStorage.getItem('activeCharacterId')) || (characters.length > 0 ? characters[0].id : null);
        if (activeCharacterId) sessionStorage.setItem('activeCharacterId', activeCharacterId);
    };

    // --- Rendering ---
    const renderCharacterList = () => {
        dom.characterList.innerHTML = '';
        characters.forEach(char => {
            const item = document.createElement('div');
            item.className = 'character-card';
            item.dataset.id = char.id;
            let content = `<img src="${char.avatar || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'}" alt="Avatar"><div class="character-info"><div class="name">${char.name}</div><div class="subtitle">${char.subtitle || ''}</div><div class="meta"><span>💬</span><span>${char.history ? char.history.length : 0}</span></div></div>`;
            if (isBatchDeleteMode) {
                item.classList.add('batch-delete-item');
                content = `<input type="checkbox" class="batch-delete-checkbox" data-id="${char.id}">${content}`;
            } else {
                item.addEventListener('click', () => { 
                    activeCharacterId = char.id; 
                    sessionStorage.setItem('activeCharacterId', activeCharacterId);
                    updateView('chat'); 
                });
            }
            item.innerHTML = content;
            dom.characterList.appendChild(item);
        });
    };

    // --- View Management ---
    const updateView = (view) => {
        if (!['chat', 'space', 'dashboard'].includes(view)) return;
        currentView = view;
        const body = document.body;
        body.classList.remove('view-chat', 'view-space', 'view-dashboard');
        body.classList.add(`view-${view}`);

        document.querySelectorAll('.main-screen').forEach(s => s.classList.add('hidden'));
        
        const screenMap = {
            chat: dom.chatScreen,
            space: dom.homeScreen,
            dashboard: dom.myDashboardScreen
        };
        screenMap[view].classList.remove('hidden');

        if (view === 'chat') renderChatHistory();
        if (view === 'space') renderCharacterList();
    };

    const showSubScreen = (screenName) => {
        if (isBatchDeleteMode) exitBatchDeleteMode();
        
        const screenMap = {
            characterDetail: dom.characterDetailScreen,
            characterEdit: dom.characterEditScreen,
            apiSettings: dom.apiSettingsScreen,
            profileSettings: dom.profileSettingsScreen,
            backgroundSettings: dom.backgroundSettingsScreen,
            chatSettings: dom.chatSettingsScreen,
        };
        
        const screenToShow = screenMap[screenName];
        if (!screenToShow) return;

        Object.values(screenMap).forEach(s => {
            if (s !== screenToShow) s.classList.add('hidden');
        });

        if (screenName === 'characterDetail' && activeCharacterId) {
            const char = characters.find(c => c.id === activeCharacterId);
            dom.detailAvatar.src = char.avatar || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
            dom.detailName.textContent = char.name;
        } else if (screenName === 'characterEdit' && activeCharacterId) {
            const char = characters.find(c => c.id === activeCharacterId);
            dom.editCharAvatar.src = char.avatar || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
            dom.editCharName.value = char.name;
            dom.editCharSubtitle.value = char.subtitle || '';
            dom.editCharSetting.value = char.setting;
        }
        screenToShow.classList.remove('hidden');
    };

    // --- Batch Delete Mode ---
    const enterBatchDeleteMode = () => { isBatchDeleteMode = true; dom.homeScreen.classList.add('batch-delete-active'); renderCharacterList(); };
    const exitBatchDeleteMode = () => { isBatchDeleteMode = false; dom.homeScreen.classList.remove('batch-delete-active'); renderCharacterList(); };

    // --- Background Settings Logic ---
    let backgrounds = {};
    const generateEntertainmentItems = () => {
        const container = document.querySelector('.entertainment-grid-new');
        if (!container) return;
        container.innerHTML = '';
        for (let i = 1; i <= 8; i++) {
            const key = `entertainmentIcon${i}`;
            container.innerHTML += `<div class="entertainment-item"><label for="upload-${key}" class="bg-preview-label"><img class="bg-preview-img" data-preview-key="${key}" src=""></label><input type="file" id="upload-${key}" class="hidden-upload" data-upload-key="${key}" accept="image/*"><input type="text" class="bg-url-input small" placeholder="URL" data-url-key="${key}"></div>`;
        }
    };
    const applyAllBackgrounds = () => {
        document.querySelectorAll('[data-bg-target]').forEach(el => { el.style.backgroundImage = ''; });
        document.querySelectorAll('img[data-preview-key]').forEach(el => { el.src = ''; });
        document.querySelectorAll('input[data-url-key]').forEach(el => { el.value = ''; });
        const blurInput = document.querySelector('input[data-blur-key="dashboard"]');
        if (blurInput) blurInput.value = '';

        Object.keys(backgrounds).forEach(key => {
            const config = backgrounds[key];
            if (!config) return;
            const targetElements = document.querySelectorAll(`[data-bg-target="${key}"]`);
            targetElements.forEach(targetElement => { if (targetElement) { targetElement.style.backgroundImage = config.url ? `url(${config.url})` : ''; } });
            const previewImg = document.querySelector(`img[data-preview-key="${key}"]`);
            if (previewImg) previewImg.src = config.url || '';
            const urlInput = document.querySelector(`input[data-url-key="${key}"]`);
            if (urlInput) urlInput.value = config.url || '';
            if (key === 'dashboard') {
                const blurValue = config.blur || 0;
                if (blurInput) blurInput.value = blurValue;
                let beforeStyle = document.getElementById('dashboard-blur-style');
                if (!beforeStyle) { beforeStyle = document.createElement('style'); beforeStyle.id = 'dashboard-blur-style'; document.head.appendChild(beforeStyle); }
                beforeStyle.textContent = `#my-dashboard-screen::before { backdrop-filter: blur(${blurValue}px); -webkit-backdrop-filter: blur(${blurValue}px); }`;
            }
        });
    };
    const saveBackgrounds = () => { localStorage.setItem('aiChatBackgrounds_v3', JSON.stringify(backgrounds)); };
    const loadBackgrounds = () => {
        const saved = localStorage.getItem('aiChatBackgrounds_v3');
        backgrounds = saved ? JSON.parse(saved) : {};
        if (!backgrounds.apiInnerCircle || !backgrounds.apiInnerCircle.url) {
            backgrounds.apiInnerCircle = { ...backgrounds.apiInnerCircle, url: 'https://sharkpan.xyz/f/wXeeHq/lantu' };
        }
        applyAllBackgrounds();
    };
    const updateBackgroundData = (key, newValues) => {
        backgrounds[key] = { ...(backgrounds[key] || {}), ...newValues };
        if (!backgrounds[key].url && (!backgrounds[key].blur || backgrounds[key].blur === 0)) { delete backgrounds[key]; }
        saveBackgrounds();
        applyAllBackgrounds();
    };
    if (dom.backgroundSettingsScreen) {
        dom.backgroundSettingsScreen.addEventListener('change', (e) => {
            if (e.target.matches('input[type="file"]')) {
                const key = e.target.dataset.uploadKey;
                const file = e.target.files[0];
                if (!key || !file) return;
                const reader = new FileReader();
                reader.onload = (event) => { updateBackgroundData(key, { url: event.target.result }); e.target.value = ''; };
                reader.readAsDataURL(file);
            } else if (e.target.matches('input[type="text"]')) {
                const urlKey = e.target.dataset.urlKey;
                const blurKey = e.target.dataset.blurKey;
                if (urlKey) { updateBackgroundData(urlKey, { url: e.target.value.trim() }); }
                if (blurKey) { const blur = parseInt(e.target.value, 10) || 0; updateBackgroundData(blurKey, { blur: Math.max(0, Math.min(20, blur)) }); }
            }
        });
    }

    // --- Editable Label Settings ---
    let labelSettings = {};
    const saveLabelSettings = () => { localStorage.setItem('aiChatLabelSettings', JSON.stringify(labelSettings)); };
    const loadLabelSettings = () => {
        const saved = localStorage.getItem('aiChatLabelSettings');
        const defaults = { opacity: '组件透明度', brightness: '组件黑白度' };
        labelSettings = saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
        Object.keys(labelSettings).forEach(key => {
            const input = document.getElementById(`label-${key}`);
            if (input) { input.value = labelSettings[key]; }
        });
    };

    // --- Event Listeners ---
    document.querySelectorAll('.page-toggle-switch').forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            const icon = e.target.closest('.toggle-icon');
            if (icon && icon.dataset.view) {
                updateView(icon.dataset.view);
            }
        });
    });

    document.querySelectorAll('.back-button').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.screen.sub-screen').classList.add('hidden');
        });
    });

    dom.chatSettingsBtn.addEventListener('click', () => showSubScreen('chatSettings'));

    dom.iconProfile.addEventListener('click', () => showSubScreen('profileSettings'));
    dom.iconApi.addEventListener('click', () => showSubScreen('apiSettings'));
    dom.iconMusic.addEventListener('click', () => alert('音乐功能正在开发中！'));
    dom.iconEntertainment.addEventListener('click', (e) => { if (e.target.classList.contains('entertainment-swatch')) { e.stopPropagation(); alert('娱乐功能正在开发中！'); } });
    dom.iconSliders.addEventListener('click', (e) => e.stopPropagation());
    dom.iconBackground.addEventListener('click', (e) => {
        if (e.target.closest('.bg-widget-bottom-left')) { showSubScreen('backgroundSettings'); } 
        else if (e.target.closest('.bg-widget-top') || e.target.closest('.bg-widget-bottom-right')) { alert('此功能待开发'); }
    });

    if (dom.iconGrid) {
        dom.iconGrid.addEventListener('change', (e) => {
            if (e.target.matches('.editable-widget-label')) {
                const key = e.target.dataset.labelKey;
                if (key) { labelSettings[key] = e.target.value; saveLabelSettings(); }
            }
        });
    }

    dom.menuBtn.addEventListener('click', (e) => { e.stopPropagation(); dom.dropdownMenu.style.display = dom.dropdownMenu.style.display === 'block' ? 'none' : 'block'; });
    dom.dropdownMenu.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        if (action) {
            if (action === 'batch-delete') { enterBatchDeleteMode(); }
             else if (action === 'theme') { showSubScreen('backgroundSettings'); }
            else { alert(`${e.target.textContent} 功能正在开发中！`); }
        }
        dom.dropdownMenu.style.display = 'none';
    });
    document.body.addEventListener('click', () => { if(dom.dropdownMenu) dom.dropdownMenu.style.display = 'none' });
    dom.addCharacterBtn.addEventListener('click', () => {
        const newChar = { id: Date.now(), name: 'New Character', subtitle: '', setting: '', avatar: '', history: [] };
        characters.push(newChar); saveCharacters(); activeCharacterId = newChar.id; showSubScreen('characterEdit');
    });
    dom.cancelDeleteBtn.addEventListener('click', exitBatchDeleteMode);
    dom.deleteSelectedBtn.addEventListener('click', () => {
        const selectedCheckboxes = dom.characterList.querySelectorAll('.batch-delete-checkbox:checked');
        if (selectedCheckboxes.length === 0) { alert('请至少选择一个要删除的角色。'); return; }
        if (confirm(`确定要删除选中的 ${selectedCheckboxes.length} 个角色吗？`)) {
            const idsToDelete = Array.from(selectedCheckboxes).map(cb => parseInt(cb.dataset.id));
            characters = characters.filter(char => !idsToDelete.includes(char.id));
            saveCharacters(); exitBatchDeleteMode();
        }
    });

    dom.goToChatBtn.addEventListener('click', () => updateView('chat'));
    dom.goToEditBtn.addEventListener('click', () => showSubScreen('characterEdit'));
    dom.characterEditForm.addEventListener('submit', (e) => {
        e.preventDefault(); const char = characters.find(c => c.id === activeCharacterId);
        if (char) { char.name = dom.editCharName.value; char.subtitle = dom.editCharSubtitle.value; char.setting = dom.editCharSetting.value; char.avatar = dom.editCharAvatar.src; saveCharacters(); }
        dom.characterEditScreen.classList.add('hidden');
        renderCharacterList();
    });
    dom.deleteCharacterBtn.addEventListener('click', () => {
        if (confirm('确定要删除这个角色吗？此操作无法撤销。')) {
            characters = characters.filter(c => c.id !== activeCharacterId);
            saveCharacters();
            activeCharacterId = characters.length > 0 ? characters[0].id : null;
            sessionStorage.setItem('activeCharacterId', activeCharacterId);
            dom.characterEditScreen.classList.add('hidden');
            updateView('space');
        }
    });
    dom.editCharAvatarUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) { const reader = new FileReader(); reader.onload = (event) => dom.editCharAvatar.src = event.target.result; reader.readAsDataURL(file); }
    });

    // Profile Settings Logic
    const saveProfileSettings = () => {
        const profile = { name: dom.userNameInput.value, setting: dom.userSettingInput.value, avatar: dom.profilePic.src };
        localStorage.setItem('aiChatProfile', JSON.stringify(profile));
        dom.dashboardUserName.textContent = profile.name || '我的设定';
        if (profile.avatar) dom.dashboardProfilePic.src = profile.avatar;
    };
    const loadProfileSettings = () => {
        const savedProfile = localStorage.getItem('aiChatProfile');
        if (savedProfile) {
            const profile = JSON.parse(savedProfile);
            dom.userNameInput.value = profile.name || '';
            dom.userSettingInput.value = profile.setting || '';
            dom.dashboardUserName.textContent = profile.name || '我的设定';
            if (profile.avatar && profile.avatar.startsWith('data:image')) {
                dom.profilePic.src = profile.avatar;
                dom.dashboardProfilePic.src = profile.avatar;
            }
        }
    };
    dom.profilePicUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) { const reader = new FileReader(); reader.onload = (event) => { dom.profilePic.src = event.target.result; saveProfileSettings(); }; reader.readAsDataURL(file); }
    });
    dom.userNameInput.addEventListener('blur', saveProfileSettings);
    dom.userSettingInput.addEventListener('blur', saveProfileSettings);

    // API Settings Logic
    const defaultModels = { openai: { "gpt-3.5-turbo": "GPT-3.5-Turbo" }, gemini: { "gemini-pro": "Gemini Pro" } };
    const restoreSelection = (modelId) => { if (!modelId) return; const optionExists = Array.from(dom.modelSelect.options).some(opt => opt.value === modelId); if (optionExists) { dom.modelSelect.value = modelId; } };
    const populateModels = (models, type) => { const group = type === 'openai' ? dom.openaiModelsGroup : dom.geminiModelsGroup; group.innerHTML = ''; for (const [id, name] of Object.entries(models)) { const option = document.createElement('option'); option.value = id; option.textContent = name; group.appendChild(option); } };
    const fetchModels = async () => {
        const apiKey = dom.apiKeyInput.value.trim();
        const previouslySelectedModel = dom.modelSelect.value;
        dom.fetchModelsButton.textContent = '正在拉取...'; dom.fetchModelsButton.disabled = true;
        try {
            if (currentApiType === 'openai') {
                const baseUrl = dom.apiUrlInput.value.trim();
                if (!baseUrl || !apiKey) throw new Error('请先填写 API 地址和密钥！');
                const response = await fetch(`${baseUrl}/v1/models`, { headers: { 'Authorization': `Bearer ${apiKey}` } });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const data = await response.json();
                const fetchedModels = data.data.reduce((acc, model) => ({ ...acc, [model.id]: model.id }), {});
                if (Object.keys(fetchedModels).length === 0) throw new Error("API未返回任何模型");
                populateModels(fetchedModels, 'openai');
                if (Object.keys(fetchedModels)[0]) dom.modelSelect.value = Object.keys(fetchedModels)[0];
            } else {
                if (!apiKey) throw new Error('请先填写 Gemini API Key！');
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const data = await response.json();
                const filteredModels = data.models.filter(m => (m.name.includes('gemini-1.5-pro') || m.name.includes('gemini-1.5-flash')) && m.supportedGenerationMethods.includes('generateContent')).reduce((acc, model) => ({ ...acc, [model.name.split('/').pop()]: model.displayName }), {});
                if (Object.keys(filteredModels).length === 0) throw new Error("未找到符合条件的Gemini模型");
                populateModels(filteredModels, 'gemini');
                if (Object.keys(filteredModels)[0]) dom.modelSelect.value = Object.keys(filteredModels)[0];
            }
            restoreSelection(previouslySelectedModel);
        } catch (error) {
            alert(`拉取模型失败: ${error.message}\n将恢复为默认列表。`);
            populateModels(defaultModels[currentApiType], currentApiType);
        } finally {
            dom.fetchModelsButton.textContent = '拉取模型'; dom.fetchModelsButton.disabled = false;
        }
    };
    const updateApiForm = (apiType) => {
        currentApiType = apiType;
        const settings = JSON.parse(localStorage.getItem('aiChatApiSettings') || '{}');
        const isGemini = apiType === 'gemini';
        dom.btnOpenAI.classList.toggle('active', !isGemini); dom.btnGemini.classList.toggle('active', isGemini);
        dom.openaiModelsGroup.hidden = isGemini; dom.geminiModelsGroup.hidden = !isGemini;
        dom.apiUrlInput.value = isGemini ? 'https://generativelanguage.googleapis.com/v1beta' : (settings.openaiApiUrl || '');
        dom.apiKeyInput.value = isGemini ? (settings.geminiApiKey || '') : (settings.openaiApiKey || '');
        dom.apiUrlInput.placeholder = isGemini ? '' : '格式参考https://example.com';
        dom.apiKeyInput.placeholder = isGemini ? 'AIzaSy... (Gemini API Key)' : 'sk-xxxxxxxxxx';
        restoreSelection(settings.model);
    };
    const saveApiSettings = () => {
        let settings = JSON.parse(localStorage.getItem('aiChatApiSettings') || '{}');
        settings.apiType = currentApiType; settings.model = dom.modelSelect.value;
        if (currentApiType === 'gemini') {
            settings.geminiApiKey = dom.apiKeyInput.value.trim();
        } else {
            settings.openaiApiUrl = dom.apiUrlInput.value.trim();
            settings.openaiApiKey = dom.apiKeyInput.value.trim();
        }
        localStorage.setItem('aiChatApiSettings', JSON.stringify(settings));
        alert('API设定已保存！');
    };
    const loadApiSettings = () => {
        populateModels(defaultModels.openai, 'openai'); populateModels(defaultModels.gemini, 'gemini');
        const settings = JSON.parse(localStorage.getItem('aiChatApiSettings') || '{}');
        updateApiForm(settings.apiType || 'openai');
    };
    dom.btnOpenAI.addEventListener('click', () => updateApiForm('openai'));
    dom.btnGemini.addEventListener('click', () => updateApiForm('gemini'));
    dom.apiSettingsForm.addEventListener('submit', (e) => { e.preventDefault(); saveApiSettings(); });
    dom.fetchModelsButton.addEventListener('click', (e) => { e.preventDefault(); fetchModels(); });
    dom.apiKeyInput.addEventListener('focus', () => { dom.apiKeyInput.type = 'text'; });
    dom.apiKeyInput.addEventListener('blur', () => { dom.apiKeyInput.type = 'password'; });

    // Chat Logic
    const renderChatHistory = () => {
        dom.chatHistory.innerHTML = '';
        const char = characters.find(c => c.id === activeCharacterId);
        
        const chatHeader = dom.chatScreen.querySelector('.page-header-bar');
        let titleEl = chatHeader.querySelector('.chat-title');
        if (!titleEl) {
            titleEl = document.createElement('h2');
            titleEl.className = 'chat-title';
            chatHeader.insertBefore(titleEl, dom.chatScreen.querySelector('.header-actions'));
        }

        if (char) {
            titleEl.textContent = char.name;
            if (char.history && char.history.length > 0) {
                char.history.forEach(msg => addMessageToHistory(msg.content, msg.role === 'ai' ? 'assistant' : 'user'));
            } else {
                const welcomeEl = document.createElement('div');
                welcomeEl.className = 'chat-welcome-message';
                welcomeEl.textContent = `你正在与 “${char.name}” 开始一段新的对话。`;
                dom.chatHistory.appendChild(welcomeEl);
            }
        } else {
            titleEl.textContent = '聊天';
            const welcomeEl = document.createElement('div');
            welcomeEl.className = 'chat-welcome-message';
            welcomeEl.innerHTML = `没有选中的聊天对象。<br>请前往 “🪷空间” 选择或创建一个角色。`;
            dom.chatHistory.appendChild(welcomeEl);
        }
    };
    const addMessageToHistory = (text, sender) => {
        const welcomeMsg = dom.chatHistory.querySelector('.chat-welcome-message');
        if (welcomeMsg) welcomeMsg.remove();

        const el = document.createElement('div');
        el.classList.add('message', sender === 'user' ? 'user-message' : 'ai-message');
        el.textContent = text;
        dom.chatHistory.appendChild(el);
        dom.chatHistory.scrollTop = dom.chatHistory.scrollHeight;
    };
    const showTypingIndicator = (show) => {
        let indicator = dom.chatHistory.querySelector('.typing-indicator');
        if (show && !indicator) {
            indicator = document.createElement('div');
            indicator.className = 'message ai-message typing-indicator';
            indicator.textContent = '...';
            dom.chatHistory.appendChild(indicator);
            dom.chatHistory.scrollTop = dom.chatHistory.scrollHeight;
        } else if (!show && indicator) {
            indicator.remove();
        }
    };
    dom.chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userMessage = dom.chatInput.value.trim();
        if (!userMessage) return;
        if (!activeCharacterId) {
            alert("请先在'🪷空间'页面选择一个角色。");
            updateView('space');
            return;
        }
        const char = characters.find(c => c.id === activeCharacterId);
        const settings = JSON.parse(localStorage.getItem('aiChatApiSettings') || '{}');
        const isGemini = settings.apiType === 'gemini';
        const apiKey = isGemini ? settings.geminiApiKey : settings.openaiApiKey;
        const apiUrl = isGemini ? 'https://generativelanguage.googleapis.com/v1beta' : settings.openaiApiUrl;
        if (!apiUrl || !apiKey) { alert('请先在“我的”页面配置 API！'); showSubScreen('apiSettings'); return; }
        
        char.history = char.history || [];
        addMessageToHistory(userMessage, 'user');
        char.history.push({ role: 'user', content: userMessage });
        saveCharacters();
        dom.chatInput.value = '';
        showTypingIndicator(true);
        try {
            let aiMessage;
            if (isGemini) {
                const fullApiUrl = `${apiUrl}/models/${settings.model}:generateContent?key=${apiKey}`;
                const geminiContents = [{ role: 'user', parts: [{ text: char.setting }] }, { role: 'model', parts: [{ text: "OK" }] }, ...char.history.map(msg => ({ role: msg.role === 'ai' ? 'model' : 'user', parts: [{ text: msg.content }] }))];
                const response = await fetch(fullApiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: geminiContents }) });
                if (!response.ok) { const err = await response.json(); throw new Error(err.error.message || JSON.stringify(err)); }
                const data = await response.json();
                aiMessage = data.candidates[0].content.parts[0].text;
            } else {
                const fullApiUrl = `${apiUrl}/v1/chat/completions`;
                const messagesPayload = [{ role: 'system', content: char.setting }, ...char.history.map(msg => ({ role: msg.role === 'ai' ? 'assistant' : 'user', content: msg.content }))];
                const response = await fetch(fullApiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` }, body: JSON.stringify({ model: settings.model || 'gpt-3.5-turbo', messages: messagesPayload }) });
                if (!response.ok) { const err = await response.json(); throw new Error(err.error.message || JSON.stringify(err)); }
                const data = await response.json();
                aiMessage = data.choices[0].message.content;
            }
            addMessageToHistory(aiMessage, 'ai');
            char.history.push({ role: 'ai', content: aiMessage });
            saveCharacters();
        } catch (error) {
            addMessageToHistory(`出错了: ${error.message}`, 'ai');
        } finally {
            showTypingIndicator(false);
        }
    });

    // Widget Settings Logic
    const updateSliderProgress = (slider) => {
        const min = +slider.min; const max = +slider.max; const val = +slider.value;
        const percentage = (val - min) * 100 / (max - min);
        slider.style.setProperty('--progress', `${percentage}%`);
    };
    const applyWidgetStyles = (opacity, brightness) => {
        const root = document.documentElement;
        root.style.setProperty('--widget-bg-lightness', `${brightness}%`);
        root.style.setProperty('--widget-bg-alpha', opacity);
    };
    const saveWidgetSettings = () => {
        const settings = { opacity: dom.opacitySlider.value, brightness: dom.brightnessSlider.value, };
        localStorage.setItem('aiChatWidgetSettings', JSON.stringify(settings));
    };
    const loadWidgetSettings = () => {
        const saved = localStorage.getItem('aiChatWidgetSettings');
        let settings = { opacity: 0.3, brightness: 0 };
        if (saved) { settings = { ...settings, ...JSON.parse(saved) }; }
        dom.opacitySlider.value = settings.opacity;
        dom.brightnessSlider.value = settings.brightness;
        applyWidgetStyles(settings.opacity, settings.brightness);
        updateSliderProgress(dom.opacitySlider);
        updateSliderProgress(dom.brightnessSlider);
    };
    dom.opacitySlider.addEventListener('input', onSliderInput);
    dom.opacitySlider.addEventListener('change', saveWidgetSettings);
    dom.brightnessSlider.addEventListener('input', onSliderInput);
    dom.brightnessSlider.addEventListener('change', saveWidgetSettings);

    // --- Initial Load ---
    const urlParams = new URLSearchParams(window.location.search);
    const initialView = urlParams.get('view') || 'space';

    loadCharacters();
    loadProfileSettings();
    loadApiSettings();
    loadWidgetSettings();
    loadLabelSettings();
    generateEntertainmentItems();
    loadBackgrounds();
    updateView(initialView);
});