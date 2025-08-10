document.addEventListener('DOMContentLoaded', () => {
    // This script should only run on app.html. If it's another page, do nothing.
    if (!document.getElementById('phone-container')) {
        return;
    }

    const dom = {
        phoneContainer: document.getElementById('phone-container'),
        // ... (其他 dom 引用保持不变)
        apiSettingsForm: document.getElementById('api-settings-form'),
        // ...
    };

    let characters = [];
    let apiConfig = {};
    let activeCharacterId = null;
    let isBatchDeleteMode = false;
    let screenHistory = [];

    // --- Data Management ---
    const saveCharacters = () => localStorage.setItem('aiChatCharacters', JSON.stringify(characters));
    const loadCharacters = () => {
        const saved = localStorage.getItem('aiChatCharacters');
        characters = saved ? JSON.parse(saved) : [{ id: Date.now(), name: 'Helpful Assistant', subtitle: 'Your default AI companion.', setting: 'You are a helpful assistant.', avatar: '', history: [] }];
        if (!saved) saveCharacters();
        activeCharacterId = parseInt(sessionStorage.getItem('activeCharacterId')) || null;
    };

    // --- API Config Management ---
    const loadApiConfig = () => {
        const saved = localStorage.getItem('aiChatApiConfig');
        const defaultConfig = JSON.parse(JSON.stringify(DEFAULT_API_CONFIG));
        apiConfig = saved ? { ...defaultConfig, ...JSON.parse(saved) } : defaultConfig;
    };

    const saveApiConfig = () => {
        localStorage.setItem('aiChatApiConfig', JSON.stringify(apiConfig));
        alert('API 设置已保存！');
    };

    // --- NEW: API Call to Fetch Models ---
    const fetchModels = async () => {
        const pullBtn = document.getElementById('pull-models-btn');
        const modelSelect = document.getElementById('api-model');
        const providerConfig = apiConfig[apiConfig.provider];

        if (!providerConfig.apiKey) {
            alert('请先输入 API Key！');
            return;
        }

        pullBtn.textContent = '拉取中...';
        pullBtn.disabled = true;

        try {
            const response = await fetch(`${providerConfig.baseUrl}/models`, {
                headers: { 'Authorization': `Bearer ${providerConfig.apiKey}` }
            });

            if (!response.ok) {
                throw new Error(`API 请求失败，状态码: ${response.status}`);
            }

            const data = await response.json();
            const models = data.data || []; // OpenAI format

            if (models.length === 0) {
                alert('未能获取到模型列表，请检查 Base URL 和 API Key。');
                return;
            }

            // Populate the select dropdown
            modelSelect.innerHTML = ''; // Clear existing options
            models.sort((a, b) => a.id.localeCompare(b.id)).forEach(model => {
                const option = document.createElement('option');
                option.value = model.id;
                option.textContent = model.id;
                if (model.id === providerConfig.model) {
                    option.selected = true; // Pre-select current model
                }
                modelSelect.appendChild(option);
            });

        } catch (error) {
            alert(`拉取模型失败: ${error.message}`);
        } finally {
            pullBtn.textContent = '拉取模型';
            pullBtn.disabled = false;
        }
    };

    // --- Rendering ---
    const renderApiSettingsForm = () => {
        const currentProvider = apiConfig.provider;
        const config = apiConfig[currentProvider];

        let formContent = `
            <div class="api-presets">
                <button class="preset-button ${currentProvider === 'openai' ? 'active' : ''}" data-provider="openai">OpenAI</button>
                <button class="preset-button ${currentProvider === 'gemini' ? 'active' : ''}" data-provider="gemini">Gemini</button>
            </div>
        `;

        if (currentProvider === 'openai') {
            formContent += `
                <div class="form-group">
                    <label for="api-base-url">API Base URL</label>
                    <input type="text" id="api-base-url" value="${config.baseUrl || ''}" placeholder="例如: https://api.openai.com/v1">
                </div>
                <div class="form-group">
                    <label for="api-key">API Key</label>
                    <input type="password" id="api-key" value="${config.apiKey || ''}" placeholder="请输入您的 OpenAI API Key">
                </div>
                <div class="form-group">
                    <div class="label-container">
                        <label for="api-model">Model</label>
                        <button type="button" id="pull-models-btn" class="pull-models-btn">拉取模型</button>
                    </div>
                    <select id="api-model">
                        <option value="${config.model || ''}">${config.model || '请先拉取模型'}</option>
                    </select>
                </div>
            `;
        } else if (currentProvider === 'gemini') {
            // Gemini part remains the same as it doesn't have a standard models endpoint
            formContent += `
                <div class="form-group">
                    <label for="api-key">API Key</label>
                    <input type="password" id="api-key" value="${config.apiKey || ''}" placeholder="请输入您的 Gemini API Key">
                </div>
                <div class="form-group">
                    <label for="api-model">Model Endpoint</label>
                    <input type="text" id="api-model" value="${config.model || ''}" placeholder="例如: gemini-pro:generateContent">
                </div>
                 <p style="font-size: 12px; color: #6c757d; text-align: center;">Gemini 的模型拉取功能暂不支持。</p>
            `;
        }

        formContent += `
            <div class="btn-group">
                <button type="submit" class="action-button btn-primary">保存设置</button>
            </div>
        `;

        dom.apiSettingsForm.innerHTML = formContent;

        // Add listeners to newly created buttons
        dom.apiSettingsForm.querySelectorAll('.preset-button').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                apiConfig.provider = e.target.dataset.provider;
                renderApiSettingsForm();
            });
        });

        const pullBtn = document.getElementById('pull-models-btn');
        if (pullBtn) {
            pullBtn.addEventListener('click', fetchModels);
        }
    };

    // ... (rest of the script remains the same)

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
                    showScreen('characterDetail');
                });
            }
            item.innerHTML = content;
            dom.characterList.appendChild(item);
        });
    };
    
    const showScreen = (screenName) => {
        if (!screenName) return;
        if (isBatchDeleteMode && screenName !== 'home') exitBatchDeleteMode();
        const currentScreen = screenHistory.length > 0 ? screenHistory[screenHistory.length - 1] : null;
        if (screenName !== currentScreen) {
            screenHistory.push(screenName);
            if (screenHistory.length > 10) screenHistory.shift();
        }
        document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
        const screenMap = {
            home: dom.homeScreen, myDashboard: dom.myDashboardScreen, characterDetail: dom.characterDetailScreen,
            characterEdit: dom.characterEditScreen, chat: dom.chatScreen, apiSettings: dom.apiSettingsScreen,
            profileSettings: dom.profileSettingsScreen, backgroundSettings: dom.backgroundSettingsScreen,
            prompts: dom.promptsScreen, space: dom.spaceScreen
        };
        if (screenMap[screenName]) screenMap[screenName].classList.remove('hidden');
        if (screenName === 'home') renderCharacterList();
        if (screenName === 'apiSettings') {
            renderApiSettingsForm();
        }
    };

    const goBack = () => {
        if (screenHistory.length > 1) {
            screenHistory.pop();
            const previousScreen = screenHistory[screenHistory.length - 1];
            document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
            const screenElement = document.getElementById(`${previousScreen}-screen`);
            if (screenElement) {
                screenElement.classList.remove('hidden');
            }
        }
    };

    const enterBatchDeleteMode = () => { isBatchDeleteMode = true; dom.homeScreen.classList.add('batch-delete-active'); renderCharacterList(); };
    const exitBatchDeleteMode = () => { isBatchDeleteMode = false; dom.homeScreen.classList.remove('batch-delete-active'); renderCharacterList(); };

    document.querySelectorAll('.back-button').forEach(btn => btn.addEventListener('click', goBack));
    
    dom.addCharacterBtn.addEventListener('click', () => {
        const newChar = { id: Date.now(), name: 'New Character', subtitle: '', setting: '', avatar: '', history: [] };
        characters.push(newChar); saveCharacters(); activeCharacterId = newChar.id; showScreen('characterEdit');
    });
    dom.menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dom.dropdownMenu.style.display = dom.dropdownMenu.style.display === 'block' ? 'none' : 'block';
    });
    dom.dropdownMenu.addEventListener('click', (e) => {
        const item = e.target.closest('.dropdown-item');
        if (!item) return;
        const targetScreen = item.dataset.targetScreen;
        const action = item.dataset.action;
        if (targetScreen) { showScreen(targetScreen); }
        else if (action) {
            switch (action) {
                case 'batch-delete': enterBatchDeleteMode(); break;
                case 'back': goBack(); break;
            }
        }
        dom.dropdownMenu.style.display = 'none';
    });
    document.body.addEventListener('click', () => { if (dom.dropdownMenu.style.display === 'block') { dom.dropdownMenu.style.display = 'none'; } });
    
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

    dom.goToChatBtn.addEventListener('click', () => showScreen('chat'));
    dom.goToEditBtn.addEventListener('click', () => showScreen('characterEdit'));
    dom.characterEditForm.addEventListener('submit', (e) => { e.preventDefault(); showScreen('characterDetail'); });

    dom.apiSettingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const currentProvider = apiConfig.provider;
        const configToSave = apiConfig[currentProvider];

        if (currentProvider === 'openai') {
            configToSave.baseUrl = document.getElementById('api-base-url').value.trim();
            configToSave.apiKey = document.getElementById('api-key').value.trim();
            configToSave.model = document.getElementById('api-model').value.trim();
        } else if (currentProvider === 'gemini') {
            configToSave.apiKey = document.getElementById('api-key').value.trim();
            configToSave.model = document.getElementById('api-model').value.trim();
        }
        
        saveApiConfig();
        goBack();
    });

    const initialSetup = () => {
        loadCharacters();
        loadApiConfig();
        const urlParams = new URLSearchParams(window.location.search);
        const startScreen = urlParams.get('start');
        showScreen(startScreen || 'home');
    };

    initialSetup();
});
