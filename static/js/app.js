// AI-Based Fake News Detector - Working JavaScript
// All functionalities properly connected and working

// Global variables
let analysisHistory = JSON.parse(localStorage.getItem('analysisHistory')) || [];
let currentTheme = localStorage.getItem('selectedTheme') || 'cosmic';

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing AI Fake News Detector...');
    
    // Core functionality
    setupFormSubmission();
    setupThemeSystem();
    loadAnalysisHistory();
    
    // Interactive features
    setupInteractiveElements();
    setupParticleSystem();
    setupVoiceFeatures();
    setupKeyboardShortcuts();
    
    // Visual effects
    setupScrollEffects();
    setupMouseTracking();
    initializeAnimations();
    
    // Mobile optimizations
    setupMobileOptimizations();
    
    console.log('✅ App initialized successfully!');
});

// 🔥 WORKING FORM SUBMISSION
function setupFormSubmission() {
    const form = document.getElementById('newsForm');
    const submitBtn = document.getElementById('submitBtn');
    const newsText = document.getElementById('newsText');
    
    if (!form) {
        console.error('❌ Form not found! Make sure HTML has id="newsForm"');
        return;
    }
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const text = newsText.value.trim();
        if (!text) {
            showAlert('Please enter some news text to analyze.', 'warning');
            return;
        }
        
        console.log('📝 Analyzing text:', text.substring(0, 50) + '...');
        
        // Show loading
        showLoading(true);
        
        // Disable submit button
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Analyzing...';
        }
        
        try {
            const startTime = Date.now();
            
            // Make API request to Flask backend with timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
            
            const response = await fetch('/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: text }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                let errorMessage = 'Connection failed';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || `Server error (${response.status})`;
                } catch {
                    errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }
            
            const result = await response.json();
            const endTime = Date.now();
            const processingTime = ((endTime - startTime) / 1000).toFixed(1);
            
            console.log('📊 Analysis result:', result);
            console.log(`⏱️ Processing completed in ${processingTime}s`);
            
            // Hide loading
            showLoading(false);
            
            // Display results
            displayResults(result, text);
            
            // Add to history
            addToHistory(text, result);
            
            // Show success message with processing time
            showAlert(`✅ Analysis completed successfully in ${processingTime}s!`, 'success');
            
        } catch (error) {
            console.error('❌ Error during analysis:', error);
            showLoading(false);
            
            let errorMessage = '🔌 Connection failed - analysis could not be completed.';
            let alertType = 'danger';
            
            if (error.name === 'AbortError') {
                errorMessage = '⏱️ Request timed out. The server may be busy. Please try again.';
            } else if (error.message.includes('Failed to fetch')) {
                errorMessage = '🌐 Network error. Please check your internet connection and try again.';
            } else if (error.message.includes('Server error')) {
                errorMessage = '🔧 Server error occurred. The analysis service may be temporarily unavailable.';
            } else if (error.message.includes('Connection failed')) {
                errorMessage = '⚠️ ' + error.message + '. The AI model may be loading. Please wait a moment and try again.';
                alertType = 'warning';
            }
            
            showAlert(errorMessage, alertType, 8000); // Show longer for errors
            
            // Provide helpful suggestions
            setTimeout(() => {
                showAlert('💡 Tip: Try refreshing the page or check if the Flask server is running.', 'info', 6000);
            }, 2000);
        } finally {
            // Re-enable submit button
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-search me-2"></i>Analyze News';
            }
        }
    });
    
    console.log('✅ Form submission setup complete');
}

// 📊 DISPLAY RESULTS
function displayResults(result, originalText) {
    const resultsSection = document.getElementById('resultsSection');
    const resultsDiv = document.getElementById('results');
    
    if (!resultsSection || !resultsDiv) {
        console.error('❌ Results elements not found');
        return;
    }
    
    // Show results section with animation
    resultsSection.style.display = 'block';
    resultsSection.classList.add('fade-in-up');
    
    // Parse result - NEW FORMAT
    const prediction = result.prediction || 'Unknown';
    const status = result.status || 'UNKNOWN';
    const confidence = result.confidence || 0.5;
    const verificationScore = result.verification_score || 50;
    const keyClaims = result.key_claims || [];
    const externalVerification = result.external_verification || {};
    const recommendations = result.recommendations || [];
    
    const isReal = prediction.toLowerCase().includes('real') || prediction.toLowerCase().includes('authentic');
    const isSuspicious = status.includes('SUSPICIOUS');
    
    console.log('📈 Displaying NEW verification results - Status:', status, 'Score:', verificationScore);
    
    // Determine status color and icon
    let statusColor, statusIcon, statusText;
    if (isSuspicious) {
        statusColor = 'warning';
        statusIcon = 'fa-exclamation-triangle';
        statusText = '⚠️ SUSPICIOUS - Requires Verification';
    } else if (isReal) {
        statusColor = 'success';
        statusIcon = 'fa-check-circle';
        statusText = '✅ AUTHENTIC';
    } else {
        statusColor = 'danger';
        statusIcon = 'fa-times-circle';
        statusText = '❌ FAKE NEWS DETECTED';
    }
    
    // Create enhanced results HTML with external verification
    const resultsHTML = `
        <div class="result-card glass-effect p-4 mb-4 bounce-in">
            <div class="result-header d-flex align-items-center justify-content-between mb-3">
                <h4 class="mb-0 text-gradient">
                    <i class="fas ${statusIcon} text-${statusColor} me-2 pulse"></i>
                    External Verification Complete
                </h4>
                <div class="confidence-badge">
                    <span class="badge bg-${statusColor} fs-6 glass-hover">
                        ${(confidence * 100).toFixed(1)}% Confidence
                    </span>
                </div>
            </div>
            
            <div class="prediction-result mb-4">
                <div class="alert alert-${statusColor} d-flex align-items-center glass-effect">
                    <i class="fas ${statusIcon} fa-2x me-3 text-glow"></i>
                    <div>
                        <h5 class="alert-heading mb-1 holographic">
                            ${statusText}
                        </h5>
                        <p class="mb-0">
                            <strong>Verification Score: ${verificationScore.toFixed(1)}%</strong><br>
                            ${isSuspicious ? 
                                'This content requires additional verification from multiple sources before sharing.' :
                                isReal ? 
                                    'Content appears authentic based on external verification, but always cross-check with original sources.' :
                                    'Content shows multiple indicators of fake news. Do not share without thorough fact-checking.'
                            }
                        </p>
                    </div>
                </div>
            </div>

            <!-- Key Claims Extracted -->
            ${keyClaims && keyClaims.length > 0 ? `
            <div class="key-claims mb-4">
                <h6 class="text-light-custom mb-3">
                    <i class="fas fa-key me-2"></i>Key Claims Extracted for Verification
                </h6>
                <div class="claims-container">
                    ${keyClaims.map(claim => `
                        <span class="badge bg-info me-2 mb-2 p-2">
                            <i class="fas fa-quote-left me-1"></i>${claim}
                        </span>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            <!-- External Verification Breakdown -->
            ${externalVerification && Object.keys(externalVerification).length > 0 ? `
            <div class="verification-breakdown mb-4">
                <h6 class="text-light-custom mb-3">
                    <i class="fas fa-search me-2"></i>External Verification Breakdown
                </h6>
                <div class="row">
                    ${externalVerification.google_search_score !== undefined ? `
                    <div class="col-md-6 mb-2">
                        <div class="progress-item">
                            <div class="d-flex justify-content-between mb-1">
                                <span class="text-muted-custom">🔍 Google Search Verification</span>
                                <span class="text-light-custom">${(externalVerification.google_search_score * 100).toFixed(0)}%</span>
                            </div>
                            <div class="progress" style="height: 8px;">
                                <div class="progress-bar bg-primary" style="width: ${externalVerification.google_search_score * 100}%"></div>
                            </div>
                        </div>
                    </div>
                    ` : ''}
                    ${externalVerification.fact_check_score !== undefined ? `
                    <div class="col-md-6 mb-2">
                        <div class="progress-item">
                            <div class="d-flex justify-content-between mb-1">
                                <span class="text-muted-custom">✅ Fact-Checker Database</span>
                                <span class="text-light-custom">${(externalVerification.fact_check_score * 100).toFixed(0)}%</span>
                            </div>
                            <div class="progress" style="height: 8px;">
                                <div class="progress-bar bg-success" style="width: ${externalVerification.fact_check_score * 100}%"></div>
                            </div>
                        </div>
                    </div>
                    ` : ''}
                    ${externalVerification.ai_analysis_score !== undefined ? `
                    <div class="col-md-6 mb-2">
                        <div class="progress-item">
                            <div class="d-flex justify-content-between mb-1">
                                <span class="text-muted-custom">🤖 AI Content Analysis</span>
                                <span class="text-light-custom">${(externalVerification.ai_analysis_score * 100).toFixed(0)}%</span>
                            </div>
                            <div class="progress" style="height: 8px;">
                                <div class="progress-bar bg-info" style="width: ${externalVerification.ai_analysis_score * 100}%"></div>
                            </div>
                        </div>
                    </div>
                    ` : ''}
                    ${externalVerification.source_credibility_score !== undefined ? `
                    <div class="col-md-6 mb-2">
                        <div class="progress-item">
                            <div class="d-flex justify-content-between mb-1">
                                <span class="text-muted-custom">📰 Source Credibility</span>
                                <span class="text-light-custom">${(externalVerification.source_credibility_score * 100).toFixed(0)}%</span>
                            </div>
                            <div class="progress" style="height: 8px;">
                                <div class="progress-bar bg-warning" style="width: ${externalVerification.source_credibility_score * 100}%"></div>
                            </div>
                        </div>
                    </div>
                    ` : ''}
                </div>
            </div>
            ` : ''}

            <!-- Verification Recommendations -->
            ${recommendations && recommendations.length > 0 ? `
            <div class="verification-recommendations mb-4">
                <h6 class="text-light-custom mb-3">
                    <i class="fas fa-lightbulb me-2"></i>Verification Recommendations
                </h6>
                <div class="recommendations-grid">
                    ${recommendations.map(rec => `
                        <div class="recommendation-item glass-effect p-3 mb-2 ${rec.includes('HIGH RISK') ? 'border-danger' : rec.includes('SUSPICIOUS') ? 'border-warning' : 'border-success'}">
                            <div class="recommendation-text text-muted-custom">${rec}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            <!-- Quick Verification Links -->
            <div class="quick-verification mb-4">
                <h6 class="text-light-custom mb-3">
                    <i class="fas fa-external-link-alt me-2"></i>Quick Verification Resources
                </h6>
                <div class="row">
                    <div class="col-md-4 mb-2">
                        <a href="https://www.snopes.com" target="_blank" class="btn btn-outline-primary btn-sm w-100">
                            <i class="fas fa-search me-1"></i>Snopes.com
                        </a>
                    </div>
                    <div class="col-md-4 mb-2">
                        <a href="https://www.factcheck.org" target="_blank" class="btn btn-outline-primary btn-sm w-100">
                            <i class="fas fa-check-double me-1"></i>FactCheck.org
                        </a>
                    </div>
                    <div class="col-md-4 mb-2">
                        <a href="https://www.politifact.com" target="_blank" class="btn btn-outline-primary btn-sm w-100">
                            <i class="fas fa-balance-scale me-1"></i>PolitiFact
                        </a>
                    </div>
                </div>
            </div>

            <!-- Action Buttons -->
            <div class="action-buttons d-flex justify-content-center flex-wrap gap-2 mt-4">
                <button class="btn btn-outline-primary btn-sm" onclick="saveAnalysis()">
                    <i class="fas fa-save me-1"></i>Save Analysis
                </button>
                <button class="btn btn-outline-secondary btn-sm" onclick="shareResult()">
                    <i class="fas fa-share me-1"></i>Share Result
                </button>
                <button class="btn btn-outline-info btn-sm" onclick="reanalyzeText('${originalText.replace(/'/g, "\\'")}')">
                    <i class="fas fa-redo me-1"></i>Re-analyze
                </button>
            </div>
        </div>
    `;
    
    resultsDiv.innerHTML = resultsHTML;
    
    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    // Voice announcement for accessibility
    if (window.speechSynthesis) {
        const announcement = `Analysis complete. ${statusText}. Confidence: ${(confidence * 100).toFixed(0)} percent.`;
        speakResults(announcement, confidence);
    }
    
    console.log('✅ Results displayed successfully with external verification');
}

// 📚 HISTORY MANAGEMENT
function addToHistory(text, result) {
    const historyItem = {
        id: Date.now(),
        text: text.substring(0, 150) + (text.length > 150 ? '...' : ''),
        fullText: text,
        prediction: result.prediction || 'Unknown',
        confidence: result.confidence || 0.5,
        timestamp: new Date().toLocaleString(),
        isReal: (result.prediction || '').toLowerCase().includes('real') || (result.prediction || '').toLowerCase().includes('authentic')
    };
    
    analysisHistory.unshift(historyItem);
    
    // Keep only last 20 items
    if (analysisHistory.length > 20) {
        analysisHistory = analysisHistory.slice(0, 20);
    }
    
    // Save to localStorage
    localStorage.setItem('analysisHistory', JSON.stringify(analysisHistory));
    
    // Update display
    updateHistoryDisplay();
    
    console.log('📝 Added to history:', historyItem.text);
}

function loadAnalysisHistory() {
    updateHistoryDisplay();
    console.log('📚 Loaded', analysisHistory.length, 'history items');
}

function updateHistoryDisplay() {
    const historyContainer = document.getElementById('historyContainer');
    if (!historyContainer) {
        console.warn('⚠️ History container not found');
        return;
    }
    
    if (analysisHistory.length === 0) {
        historyContainer.innerHTML = `
            <div class="history-empty">
                <i class="fas fa-history fa-3x mb-3 opacity-50 float-animation"></i>
                <h5>No Analysis History</h5>
                <p>Your analysis history will appear here after you analyze some news.</p>
            </div>
        `;
        return;
    }
    
    const historyHTML = analysisHistory.map((item, index) => `
        <div class="history-item ${item.isReal ? 'border-success' : 'border-danger'}" 
             data-id="${item.id}" 
             style="animation: fadeInUp 0.6s ease-out ${index * 0.1}s both;">
            
            <div class="history-content">
                <div class="history-text">
                    <i class="fas ${item.isReal ? 'fa-check-circle text-success' : 'fa-times-circle text-danger'} me-2"></i>
                    ${item.text}
                </div>
                
                <div class="history-meta">
                    <div class="history-meta-left">
                        <div class="history-timestamp">
                            <i class="fas fa-clock me-1"></i>
                            ${item.timestamp}
                        </div>
                        <div class="history-confidence">
                            <i class="fas fa-percentage me-1"></i>
                            ${(item.confidence * 100).toFixed(1)}% confidence
                        </div>
                    </div>
                    <div class="history-meta-right">
                        <span class="history-prediction badge ${item.isReal ? 'bg-success-gradient' : 'bg-danger-gradient'}">
                            ${item.prediction || (item.isReal ? 'Authentic' : 'Suspicious')}
                        </span>
                    </div>
                </div>
            </div>
            
            <div class="history-actions">
                <button class="btn btn-outline-info btn-sm" 
                        onclick="reanalyzeText('${item.fullText.replace(/'/g, "\\'")}')">
                    <i class="fas fa-redo me-1"></i>
                    <span class="d-none d-sm-inline">Reanalyze</span>
                </button>
                <button class="btn btn-outline-danger btn-sm" 
                        onclick="removeHistoryItem(${item.id})">
                    <i class="fas fa-trash me-1"></i>
                    <span class="d-none d-sm-inline">Remove</span>
                </button>
            </div>
        </div>
    `).join('');
    
    historyContainer.innerHTML = historyHTML;
}

function clearHistory() {
    if (confirm('🗑️ Are you sure you want to clear all analysis history?')) {
        analysisHistory = [];
        localStorage.removeItem('analysisHistory');
        updateHistoryDisplay();
        showAlert('History cleared successfully!', 'success');
    }
}

function removeHistoryItem(id) {
    analysisHistory = analysisHistory.filter(item => item.id !== id);
    localStorage.setItem('analysisHistory', JSON.stringify(analysisHistory));
    updateHistoryDisplay();
    showAlert('Item removed from history', 'info');
}

function reanalyzeText(text) {
    if (!text || text.trim() === '') {
        showAlert('❌ No text to reanalyze!', 'warning');
        return;
    }

    try {
        // Set the text in the textarea
        const textArea = document.getElementById('newsText');
        if (textArea) {
            textArea.value = text;
            
            // Scroll to the form
            textArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Focus the textarea briefly to show it's been updated
            textArea.focus();
            setTimeout(() => textArea.blur(), 500);
            
            // Trigger the analysis
            const form = document.getElementById('newsForm');
            if (form) {
                // Create and dispatch a submit event
                const submitEvent = new Event('submit', {
                    bubbles: true,
                    cancelable: true
                });
                form.dispatchEvent(submitEvent);
                
                showAlert('🔄 Reanalyzing text...', 'info', 2000);
            } else {
                showAlert('❌ Analysis form not found!', 'danger');
            }
        } else {
            showAlert('❌ Text input not found!', 'danger');
        }
    } catch (error) {
        console.error('Error in reanalyzeText:', error);
        showAlert('❌ Error starting reanalysis', 'danger');
    }
}

// 🎨 THEME SYSTEM
function setupThemeSystem() {
    const themes = {
        cosmic: {
            name: '🌌 Cosmic',
            primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            secondary: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            background: 'radial-gradient(circle at 30% 40%, #667eea 0%, transparent 50%), radial-gradient(circle at 80% 20%, #f093fb 0%, transparent 50%), radial-gradient(circle at 40% 80%, #4facfe 0%, transparent 50%)',
            accent: '#667eea'
        },
        ocean: {
            name: '🌊 Ocean Depths',
            primary: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)',
            secondary: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
            background: 'radial-gradient(circle at 30% 40%, #00c6ff 0%, transparent 50%), radial-gradient(circle at 80% 20%, #0072ff 0%, transparent 50%), radial-gradient(circle at 40% 80%, #4facfe 0%, transparent 50%)',
            accent: '#00c6ff'
        },
        sunset: {
            name: '🌅 Sunset Glow',
            primary: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
            secondary: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
            background: 'radial-gradient(circle at 30% 40%, #ff9a9e 0%, transparent 50%), radial-gradient(circle at 80% 20%, #fecfef 0%, transparent 50%), radial-gradient(circle at 40% 80%, #fcb69f 0%, transparent 50%)',
            accent: '#ff9a9e'
        },
        forest: {
            name: '🌲 Forest Mist',
            primary: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
            secondary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            background: 'radial-gradient(circle at 30% 40%, #11998e 0%, transparent 50%), radial-gradient(circle at 80% 20%, #38ef7d 0%, transparent 50%), radial-gradient(circle at 40% 80%, #667eea 0%, transparent 50%)',
            accent: '#11998e'
        },
        aurora: {
            name: '🌈 Aurora Borealis',
            primary: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
            secondary: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
            background: 'radial-gradient(circle at 30% 40%, #a8edea 0%, transparent 50%), radial-gradient(circle at 80% 20%, #fed6e3 0%, transparent 50%), radial-gradient(circle at 40% 80%, #ff9a9e 0%, transparent 50%)',
            accent: '#a8edea'
        },
        neon: {
            name: '💫 Neon City',
            primary: 'linear-gradient(135deg, #ff006e 0%, #fb8500 100%)',
            secondary: 'linear-gradient(135deg, #ffbe0b 0%, #8338ec 100%)',
            background: 'radial-gradient(circle at 30% 40%, #ff006e 0%, transparent 50%), radial-gradient(circle at 80% 20%, #fb8500 0%, transparent 50%), radial-gradient(circle at 40% 80%, #8338ec 0%, transparent 50%)',
            accent: '#ff006e'
        }
    };
    
    createThemeSelector(themes);
    applyStoredTheme(themes);
    
    window.themes = themes;
    console.log('🎨 Theme system initialized with', Object.keys(themes).length, 'themes');
}

function createThemeSelector(themes) {
    // Remove existing theme selector
    const existing = document.querySelector('.theme-selector');
    if (existing) existing.remove();
    
    const themeSelector = document.createElement('div');
    themeSelector.className = 'theme-selector position-fixed glass-effect p-3';
    
    // Mobile-responsive positioning
    const isMobile = window.innerWidth <= 480;
    themeSelector.style.cssText = `
        ${isMobile ? 
            'top: 10px; right: 10px; left: 10px; width: auto; min-width: auto; max-width: none;' : 
            'top: 20px; right: 20px; min-width: 220px;'
        }
        z-index: 1001;
        border-radius: 15px;
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.2);
    `;
    
    const themeOptions = Object.entries(themes).map(([key, theme]) => 
        `<option value="${key}" ${key === currentTheme ? 'selected' : ''}>${theme.name}</option>`
    ).join('');
    
    themeSelector.innerHTML = `
        <div class="d-flex align-items-center mb-2">
            <i class="fas fa-palette me-2 text-light-custom"></i>
            <span class="text-light-custom fw-bold">Choose Theme</span>
        </div>
        <select class="form-select form-select-sm glass-effect text-light-custom" id="themeSelect" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);">
            ${themeOptions}
        </select>
        <div class="theme-preview mt-2 p-2 rounded d-flex align-items-center justify-content-center" style="height: 30px; background: var(--primary-gradient); color: white; font-size: 0.8rem; font-weight: bold;">
            ${themes[currentTheme].name}
        </div>
    `;
    
    document.body.appendChild(themeSelector);
    
    // Update positioning on window resize
    window.addEventListener('resize', () => {
        const isMobileNow = window.innerWidth <= 480;
        themeSelector.style.cssText = `
            ${isMobileNow ? 
                'top: 10px; right: 10px; left: 10px; width: auto; min-width: auto; max-width: none;' : 
                'top: 20px; right: 20px; min-width: 220px;'
            }
            z-index: 1001;
            border-radius: 15px;
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        `;
    });
    
    const themeSelect = document.getElementById('themeSelect');
    themeSelect.addEventListener('change', (e) => {
        currentTheme = e.target.value;
        localStorage.setItem('selectedTheme', currentTheme);
        applyTheme(themes[currentTheme]);
        showAlert(`Theme changed to ${themes[currentTheme].name}!`, 'success');
        
        // Update preview
        const preview = themeSelector.querySelector('.theme-preview');
        preview.textContent = themes[currentTheme].name;
    });
}

function applyTheme(theme) {
    const root = document.documentElement;
    root.style.setProperty('--primary-gradient', theme.primary);
    root.style.setProperty('--secondary-gradient', theme.secondary);
    root.style.setProperty('--cosmic-gradient', theme.background);
    root.style.setProperty('--theme-accent', theme.accent);
    
    // Add smooth transition
    document.body.style.transition = 'all 0.8s ease';
    setTimeout(() => {
        document.body.style.transition = '';
    }, 800);
    
    console.log('🎨 Applied theme:', theme.name);
}

function applyStoredTheme(themes) {
    if (themes && themes[currentTheme]) {
        applyTheme(themes[currentTheme]);
    }
}

// 🔊 LOADING SYSTEM
function showLoading(show) {
    let overlay = document.getElementById('loadingOverlay');
    
    if (show) {
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'loadingOverlay';
            overlay.className = 'loading-overlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(15px);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999;
                animation: fadeIn 0.3s ease;
            `;
            
            overlay.innerHTML = `
                <div class="text-center">
                    <div class="spinner mb-4"></div>
                    <h4 class="text-light-custom mb-2 text-glow">🤖 AI is Analyzing</h4>
                    <p class="text-muted-custom">Processing your news content with advanced algorithms...</p>
                    <div class="loading-progress mt-4">
                        <div class="progress" style="height: 8px; background: rgba(255,255,255,0.1);">
                            <div class="progress-bar animated" id="loadingProgress" style="width: 0%; background: var(--primary-gradient);"></div>
                        </div>
                        <div class="loading-status mt-2 text-muted-custom">
                            <span id="loadingStatus">Initializing analysis...</span>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(overlay);
        }
        
        overlay.style.display = 'flex';
        startLoadingProgress();
        
    } else {
        if (overlay) {
            overlay.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                overlay.style.display = 'none';
            }, 300);
        }
    }
}

function startLoadingProgress() {
    const progressBar = document.getElementById('loadingProgress');
    const statusText = document.getElementById('loadingStatus');
    
    if (!progressBar || !statusText) return;
    
    const steps = [
        '🔍 Preprocessing text...',
        '🧠 Tokenizing content...',
        '📊 Analyzing patterns...',
        '🤖 Running AI model...',
        '📈 Calculating confidence...',
        '✅ Finalizing results...'
    ];
    
    let currentStep = 0;
    const interval = setInterval(() => {
        if (currentStep < steps.length) {
            const progress = ((currentStep + 1) / steps.length) * 100;
            progressBar.style.width = progress + '%';
            statusText.textContent = steps[currentStep];
            currentStep++;
        } else {
            clearInterval(interval);
        }
    }, 600);
}

// 🚨 ALERT SYSTEM
function showAlert(message, type = 'info', duration = 4000) {
    const alertContainer = getOrCreateAlertContainer();
    
    const alertId = 'alert-' + Date.now();
    const icons = {
        success: 'fa-check-circle',
        danger: 'fa-exclamation-circle', 
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    const alertHTML = `
        <div class="alert alert-${type} alert-dismissible fade show glass-effect mb-2" id="${alertId}" role="alert" style="animation: slideInRight 0.3s ease;">
            <i class="fas ${icons[type]} me-2"></i>
            ${message}
            <button type="button" class="btn-close btn-close-white" onclick="closeAlert('${alertId}')"></button>
        </div>
    `;
    
    alertContainer.insertAdjacentHTML('beforeend', alertHTML);
    
    // Auto-dismiss
    setTimeout(() => {
        closeAlert(alertId);
    }, duration);
    
    console.log('🚨 Alert:', type, '-', message);
}

function getOrCreateAlertContainer() {
    let container = document.getElementById('alertContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'alertContainer';
        container.className = 'position-fixed';
        
        // Mobile-responsive positioning
        const isMobile = window.innerWidth <= 480;
        if (isMobile) {
            container.style.cssText = 'top: 80px; right: 10px; left: 10px; z-index: 9998; max-width: none;';
        } else {
            container.style.cssText = 'top: 80px; right: 20px; z-index: 9998; max-width: 400px;';
        }
        
        document.body.appendChild(container);
    }
    return container;
}

function closeAlert(alertId) {
    const alert = document.getElementById(alertId);
    if (alert) {
        alert.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => alert.remove(), 300);
    }
}

// 🎮 INTERACTIVE ELEMENTS
function setupInteractiveElements() {
    // Enhanced card hover effects
    document.querySelectorAll('.card').forEach(card => {
        card.addEventListener('mouseenter', function(e) {
            this.style.transform = 'translateY(-10px) scale(1.02)';
            this.style.boxShadow = '0 25px 50px rgba(0, 0, 0, 0.3)';
            createParticleBurst(e.clientX, e.clientY, 6);
        });

        card.addEventListener('mouseleave', function() {
            this.style.transform = '';
            this.style.boxShadow = '';
        });
    });

    // Button click effects
    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            createRippleEffect(e, this);
        });
        
        btn.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
        });
        
        btn.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
    });

    // Form field focus effects
    document.querySelectorAll('.form-control').forEach(input => {
        input.addEventListener('focus', function() {
            this.style.transform = 'scale(1.02)';
            this.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.3)';
        });

        input.addEventListener('blur', function() {
            this.style.transform = '';
            this.style.boxShadow = '';
        });
    });
    
    console.log('🎮 Interactive elements initialized');
}

// ✨ PARTICLE SYSTEM
function setupParticleSystem() {
    const particleContainer = document.createElement('div');
    particleContainer.className = 'particle-field';
    particleContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: -1;
        overflow: hidden;
    `;

    // Create floating particles
    for (let i = 0; i < 15; i++) {
        createFloatingParticle(particleContainer);
    }

    document.body.appendChild(particleContainer);
    console.log('✨ Particle system created');
}

function createFloatingParticle(container) {
    const particle = document.createElement('div');
    const size = Math.random() * 4 + 2;
    const opacity = Math.random() * 0.6 + 0.2;
    const duration = Math.random() * 25 + 20;
    const delay = Math.random() * 10;
    
    particle.className = 'floating-particle';
    particle.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background: radial-gradient(circle, rgba(255, 255, 255, ${opacity}), transparent);
        border-radius: 50%;
        left: ${Math.random() * 100}%;
        top: 100%;
        animation: floatUp ${duration}s ${delay}s linear infinite;
        box-shadow: 0 0 ${size * 3}px rgba(255, 255, 255, ${opacity * 0.5});
    `;

    container.appendChild(particle);

    // Remove and recreate particle after animation
    setTimeout(() => {
        if (particle.parentNode) {
            particle.remove();
            createFloatingParticle(container);
        }
    }, (duration + delay) * 1000);
}

function createParticleBurst(x, y, count = 8) {
    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            width: 4px;
            height: 4px;
            background: radial-gradient(circle, var(--theme-accent, #667eea), transparent);
            border-radius: 50%;
            pointer-events: none;
            z-index: 9999;
        `;
        
        const angle = (i / count) * Math.PI * 2;
        const velocity = 40 + Math.random() * 40;
        
        document.body.appendChild(particle);
        
        particle.animate([
            { 
                transform: 'translate(-50%, -50%) scale(1)', 
                opacity: 1 
            },
            { 
                transform: `translate(${Math.cos(angle) * velocity - 50}px, ${Math.sin(angle) * velocity - 50}px) scale(0)`, 
                opacity: 0 
            }
        ], {
            duration: 1000,
            easing: 'ease-out'
        }).onfinish = () => particle.remove();
    }
}

// 🎤 VOICE FEATURES
function setupVoiceFeatures() {
    if ('speechRecognition' in window || 'webkitSpeechRecognition' in window) {
        const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        
        addVoiceButton(recognition);
        console.log('🎤 Voice recognition enabled');
    } else {
        console.log('🎤 Voice recognition not supported');
    }
}

function addVoiceButton(recognition) {
    const voiceBtn = document.createElement('button');
    voiceBtn.type = 'button';
    voiceBtn.className = 'btn btn-outline-light btn-sm mt-2 me-2 glass-hover';
    voiceBtn.innerHTML = '<i class="fas fa-microphone me-1"></i>🎤 Voice Input';
    
    voiceBtn.addEventListener('click', () => {
        recognition.start();
        voiceBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>🎧 Listening...';
        voiceBtn.disabled = true;
        voiceBtn.classList.add('btn-warning');
        
        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            document.getElementById('newsText').value = transcript;
            showAlert('🎤 Voice input captured successfully!', 'success');
        };
        
        recognition.onend = function() {
            voiceBtn.innerHTML = '<i class="fas fa-microphone me-1"></i>🎤 Voice Input';
            voiceBtn.disabled = false;
            voiceBtn.classList.remove('btn-warning');
        };
        
        recognition.onerror = function(event) {
            showAlert('🎤 Voice recognition error: ' + event.error, 'warning');
            voiceBtn.innerHTML = '<i class="fas fa-microphone me-1"></i>🎤 Voice Input';
            voiceBtn.disabled = false;
            voiceBtn.classList.remove('btn-warning');
        };
    });
    
    const textareaContainer = document.getElementById('newsText')?.parentElement;
    if (textareaContainer) {
        textareaContainer.appendChild(voiceBtn);
    }
}

// ⌨️ KEYBOARD SHORTCUTS
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Ctrl+Enter to submit form
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            const form = document.getElementById('newsForm');
            if (form) {
                form.dispatchEvent(new Event('submit'));
                showAlert('⌨️ Form submitted via keyboard shortcut!', 'info');
            }
        }
        
        // Escape to close loading/overlays
        if (e.key === 'Escape') {
            showLoading(false);
            const alerts = document.querySelectorAll('.alert');
            alerts.forEach(alert => alert.remove());
        }
        
        // Ctrl+K to focus textarea
        if (e.ctrlKey && e.key === 'k') {
            e.preventDefault();
            const textarea = document.getElementById('newsText');
            if (textarea) {
                textarea.focus();
                showAlert('⌨️ Focused on text input!', 'info');
            }
        }
        
        // Ctrl+H to clear history
        if (e.ctrlKey && e.key === 'h') {
            e.preventDefault();
            clearHistory();
        }
    });
    
    // Show keyboard shortcuts help
    setTimeout(() => {
        showKeyboardShortcutsHelp();
    }, 3000);
    
    console.log('⌨️ Keyboard shortcuts enabled');
}

function showKeyboardShortcutsHelp() {
    const helpDiv = document.createElement('div');
    helpDiv.className = 'keyboard-help position-fixed glass-effect p-3';
    helpDiv.style.cssText = `
        bottom: 20px;
        left: 20px;
        z-index: 1000;
        max-width: 280px;
        border-radius: 15px;
        animation: slideInLeft 0.5s ease;
    `;
    
    helpDiv.innerHTML = `
        <div class="d-flex align-items-center justify-content-between mb-2">
            <h6 class="text-light-custom mb-0">
                <i class="fas fa-keyboard me-2"></i>⌨️ Shortcuts
            </h6>
            <button class="btn-close btn-close-white btn-sm" onclick="this.parentElement.parentElement.remove()"></button>
        </div>
        <div class="small text-muted-custom">
            <div class="mb-1"><kbd>Ctrl+Enter</kbd> Submit form</div>
            <div class="mb-1"><kbd>Ctrl+K</kbd> Focus text input</div>
            <div class="mb-1"><kbd>Ctrl+H</kbd> Clear history</div>
            <div><kbd>Esc</kbd> Close overlays</div>
        </div>
    `;
    
    document.body.appendChild(helpDiv);
    
    // Auto-hide after 8 seconds
    setTimeout(() => {
        if (helpDiv.parentNode) {
            helpDiv.style.animation = 'slideOutLeft 0.5s ease';
            setTimeout(() => helpDiv.remove(), 500);
        }
    }, 8000);
}

// 📊 SCROLL EFFECTS
function setupScrollEffects() {
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', () => {
        const scrolled = window.scrollY > 50;
        
        if (navbar) {
            if (scrolled) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }
        
        // Parallax effect for background
        const scrollPercent = window.scrollY / (document.body.scrollHeight - window.innerHeight);
        document.body.style.backgroundPosition = `center ${scrollPercent * 50}px`;
    });
    
    console.log('📊 Scroll effects initialized');
}

// 🖱️ MOUSE TRACKING
function setupMouseTracking() {
    document.addEventListener('mousemove', (e) => {
        const mouseX = (e.clientX / window.innerWidth) * 100;
        const mouseY = (e.clientY / window.innerHeight) * 100;
        
        document.documentElement.style.setProperty('--mouse-x', mouseX + '%');
        document.documentElement.style.setProperty('--mouse-y', mouseY + '%');
    });
    
    console.log('🖱️ Mouse tracking enabled');
}

// 🎬 ANIMATIONS
function initializeAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-up');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.card, .alert, .history-item').forEach(el => {
        observer.observe(el);
    });
    
    console.log('🎬 Intersection Observer initialized');
}

// 💫 RIPPLE EFFECT
function createRippleEffect(event, element) {
    const ripple = document.createElement('span');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: radial-gradient(circle, rgba(255, 255, 255, 0.6) 0%, transparent 70%);
        border-radius: 50%;
        pointer-events: none;
        transform: scale(0);
        animation: ripple 0.6s ease-out;
        z-index: 1;
    `;

    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);

    setTimeout(() => ripple.remove(), 600);
}

// 🔧 UTILITY FUNCTIONS
function speakResults(prediction, confidence) {
    if ('speechSynthesis' in window) {
        const cleanPrediction = prediction.replace(/['"]/g, '');
        const text = `Analysis complete. The news appears to be ${cleanPrediction} with ${Math.round(confidence * 100)} percent confidence.`;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.8;
        utterance.pitch = 1;
        speechSynthesis.speak(utterance);
        showAlert('🔊 Reading results aloud...', 'info');
    } else {
        showAlert('🔊 Speech synthesis not supported in this browser.', 'warning');
    }
}

function saveAnalysis() {
    const resultsDiv = document.getElementById('results');
    if (!resultsDiv || !resultsDiv.innerHTML.trim()) {
        showAlert('No analysis results to save!', 'warning');
        return;
    }

    try {
        // Check if jsPDF is available
        if (typeof window.jspdf === 'undefined') {
            showAlert('PDF library not loaded. Please refresh the page and try again.', 'warning');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Get the current analysis data
        const resultCard = resultsDiv.querySelector('.result-card');
        if (!resultCard) {
            showAlert('No analysis data found!', 'warning');
            return;
        }

        // Extract analysis data
        const prediction = resultCard.querySelector('.result-header h4')?.textContent || 'Unknown';
        const confidence = resultCard.querySelector('.confidence-badge .badge')?.textContent || '0%';
        const timestamp = new Date().toLocaleString();
        const originalText = document.getElementById('newsText').value || '';
        
        // Extract verification scores
        const verificationScores = [];
        resultCard.querySelectorAll('.progress-item').forEach(item => {
            const label = item.querySelector('div:first-child')?.textContent || '';
            const progressBar = item.querySelector('.progress-bar');
            const score = progressBar ? progressBar.style.width || '0%' : '0%';
            verificationScores.push(`${label}: ${score}`);
        });

        // Extract key claims
        const claims = [];
        resultCard.querySelectorAll('.claims-container .badge').forEach(badge => {
            claims.push(badge.textContent.trim());
        });

        // Extract recommendations
        const recommendations = [];
        resultCard.querySelectorAll('.recommendation-item .recommendation-text').forEach(rec => {
            recommendations.push(rec.textContent.trim());
        });

        // Create PDF content
        let yPos = 20;
        
        // Header
        doc.setFontSize(20);
        doc.setTextColor(44, 62, 80);
        doc.text('AI Fake News Detection Report', 20, yPos);
        yPos += 15;
        
        doc.setFontSize(12);
        doc.setTextColor(127, 140, 141);
        doc.text(`Generated: ${timestamp}`, 20, yPos);
        yPos += 20;
        
        // Analysis Summary
        doc.setFontSize(16);
        doc.setTextColor(52, 73, 94);
        doc.text('Analysis Summary', 20, yPos);
        yPos += 10;
        
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(`Prediction: ${prediction}`, 20, yPos);
        yPos += 8;
        doc.text(`Confidence: ${confidence}`, 20, yPos);
        yPos += 15;
        
        // Original Text
        doc.setFontSize(16);
        doc.setTextColor(52, 73, 94);
        doc.text('Original Text', 20, yPos);
        yPos += 10;
        
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        const textLines = doc.splitTextToSize(originalText.substring(0, 800) + (originalText.length > 800 ? '...' : ''), 170);
        doc.text(textLines, 20, yPos);
        yPos += textLines.length * 5 + 10;
        
        // Verification Scores
        if (verificationScores.length > 0) {
            doc.setFontSize(16);
            doc.setTextColor(52, 73, 94);
            doc.text('Verification Breakdown', 20, yPos);
            yPos += 10;
            
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            verificationScores.forEach(score => {
                doc.text(`• ${score}`, 20, yPos);
                yPos += 6;
            });
            yPos += 10;
        }
        
        // Key Claims
        if (claims.length > 0) {
            doc.setFontSize(16);
            doc.setTextColor(52, 73, 94);
            doc.text('Key Claims Identified', 20, yPos);
            yPos += 10;
            
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            claims.forEach((claim, index) => {
                const claimLines = doc.splitTextToSize(`${index + 1}. ${claim}`, 170);
                doc.text(claimLines, 20, yPos);
                yPos += claimLines.length * 5 + 2;
            });
            yPos += 10;
        }
        
        // Recommendations
        if (recommendations.length > 0) {
            doc.setFontSize(16);
            doc.setTextColor(52, 73, 94);
            doc.text('Recommendations', 20, yPos);
            yPos += 10;
            
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            recommendations.forEach((rec, index) => {
                const recLines = doc.splitTextToSize(`${index + 1}. ${rec}`, 170);
                doc.text(recLines, 20, yPos);
                yPos += recLines.length * 5 + 2;
            });
        }
        
        // Footer
        doc.setFontSize(8);
        doc.setTextColor(127, 140, 141);
        doc.text('Generated by AI Fake News Detector - Made by Kunal', 20, 280);
        doc.text('This analysis is AI-generated. Verify through multiple sources.', 20, 285);
        
        // Save the PDF
        doc.save(`fake-news-analysis-${Date.now()}.pdf`);
        
        showAlert('✅ Analysis report saved as PDF successfully!', 'success');
        
    } catch (error) {
        console.error('Error saving analysis:', error);
        showAlert('❌ Error generating PDF report', 'danger');
    }
}

function shareResult() {
    const resultsDiv = document.getElementById('results');
    if (!resultsDiv || !resultsDiv.innerHTML.trim()) {
        showAlert('No analysis results to share!', 'warning');
        return;
    }

    try {
        // Extract current analysis data
        const resultCard = resultsDiv.querySelector('.result-card');
        const prediction = resultCard.querySelector('.result-header h4')?.textContent || 'Analysis Result';
        const confidence = resultCard.querySelector('.confidence-badge .badge')?.textContent || '0%';
        const originalText = document.getElementById('newsText').value.substring(0, 100) + '...';
        
        const shareText = `🛡️ AI Fake News Analysis Result:\n\n📊 Prediction: ${prediction}\n🎯 Confidence: ${confidence}\n\n📝 Analyzed Text: "${originalText}"\n\n🔗 Analyzed with AI Fake News Detector`;
        const shareUrl = window.location.href;
        
        // Show enhanced share dialog
        showEnhancedShareDialog(shareText, shareUrl);
        
    } catch (error) {
        console.error('Error sharing result:', error);
        showAlert('❌ Error preparing share content', 'danger');
    }
}

function showEnhancedShareDialog(shareText, shareUrl) {
    // Remove existing dialog
    const existingDialog = document.getElementById('shareDialog');
    if (existingDialog) existingDialog.remove();
    
    const dialog = document.createElement('div');
    dialog.id = 'shareDialog';
    dialog.className = 'modal fade show';
    dialog.style.display = 'block';
    dialog.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    dialog.style.zIndex = '9999';
    
    dialog.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content glass-effect" style="background: rgba(0, 0, 0, 0.9); border: 1px solid rgba(255, 255, 255, 0.2);">
                <div class="modal-header border-bottom border-secondary">
                    <h5 class="modal-title text-light-custom">
                        <i class="fas fa-share-alt me-2 text-gradient"></i>
                        Share Analysis Result
                    </h5>
                    <button type="button" class="btn-close btn-close-white" onclick="closeShareDialog()"></button>
                </div>
                <div class="modal-body">
                    <div class="row g-3">
                        <!-- Copy Link -->
                        <div class="col-12">
                            <button class="btn btn-outline-primary w-100 d-flex align-items-center justify-content-center" onclick="copyToClipboard('${shareUrl}')">
                                <i class="fas fa-link me-2"></i>
                                Copy Link
                            </button>
                        </div>
                        
                        <!-- WhatsApp -->
                        <div class="col-6">
                            <button class="btn btn-outline-success w-100 d-flex align-items-center justify-content-center" onclick="shareToWhatsApp('${encodeURIComponent(shareText)}')">
                                <i class="fab fa-whatsapp me-2"></i>
                                WhatsApp
                            </button>
                        </div>
                        
                        <!-- Telegram -->
                        <div class="col-6">
                            <button class="btn btn-outline-info w-100 d-flex align-items-center justify-content-center" onclick="shareToTelegram('${encodeURIComponent(shareText)}')">
                                <i class="fab fa-telegram me-2"></i>
                                Telegram
                            </button>
                        </div>
                        
                        <!-- Facebook -->
                        <div class="col-6">
                            <button class="btn btn-outline-primary w-100 d-flex align-items-center justify-content-center" onclick="shareToFacebook('${encodeURIComponent(shareUrl)}')">
                                <i class="fab fa-facebook me-2"></i>
                                Facebook
                            </button>
                        </div>
                        
                        <!-- Twitter -->
                        <div class="col-6">
                            <button class="btn btn-outline-info w-100 d-flex align-items-center justify-content-center" onclick="shareToTwitter('${encodeURIComponent(shareText)}', '${encodeURIComponent(shareUrl)}')">
                                <i class="fab fa-twitter me-2"></i>
                                Twitter
                            </button>
                        </div>
                        
                        <!-- Email -->
                        <div class="col-6">
                            <button class="btn btn-outline-warning w-100 d-flex align-items-center justify-content-center" onclick="shareViaEmail('${encodeURIComponent(shareText)}')">
                                <i class="fas fa-envelope me-2"></i>
                                Email
                            </button>
                        </div>
                        
                        <!-- Copy Text -->
                        <div class="col-6">
                            <button class="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center" onclick="copyToClipboard('${shareText.replace(/'/g, "\\'")}')">
                                <i class="fas fa-copy me-2"></i>
                                Copy Text
                            </button>
                        </div>
                    </div>
                    
                    <hr class="my-3" style="border-color: rgba(255, 255, 255, 0.2);">
                    
                    <!-- Preview -->
                    <div class="mt-3">
                        <label class="form-label text-light-custom">
                            <i class="fas fa-eye me-2"></i>
                            Share Preview:
                        </label>
                        <div class="p-3 rounded glass-effect" style="background: rgba(255, 255, 255, 0.05); font-size: 0.9rem; max-height: 150px; overflow-y: auto;">
                            ${shareText.replace(/\n/g, '<br>')}
                        </div>
                    </div>
                </div>
                <div class="modal-footer border-top border-secondary">
                    <button type="button" class="btn btn-outline-light" onclick="closeShareDialog()">
                        <i class="fas fa-times me-2"></i>
                        Close
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(dialog);
    
    // Add click outside to close
    dialog.addEventListener('click', function(e) {
        if (e.target === dialog) {
            closeShareDialog();
        }
    });
}

// Share helper functions
function closeShareDialog() {
    const dialog = document.getElementById('shareDialog');
    if (dialog) {
        dialog.remove();
    }
}

function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => {
            showAlert('✅ Text copied to clipboard!', 'success');
            document.querySelector('.share-dialog')?.remove();
        }).catch(err => {
            console.error('Error copying text:', err);
            showAlert('❌ Error copying text. Please try again.', 'danger');
        });
    } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            showAlert('✅ Text copied to clipboard!', 'success');
            document.querySelector('.share-dialog')?.remove();
        } catch (err) {
            console.error('Error copying text:', err);
            showAlert('❌ Error copying text. Please try again.', 'danger');
        }
        document.body.removeChild(textArea);
    }
}

function shareToWhatsApp(text) {
    window.open(`https://wa.me/?text=${text}`, '_blank');
    document.querySelector('.share-dialog')?.remove();
}

function shareToTelegram(text) {
    window.open(`https://t.me/share/url?text=${text}`, '_blank');
    document.querySelector('.share-dialog')?.remove();
}

function shareToFacebook(url) {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    document.querySelector('.share-dialog')?.remove();
}

function shareToTwitter(text) {
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
    document.querySelector('.share-dialog')?.remove();
}

function shareViaEmail(text) {
    const subject = encodeURIComponent('AI Fake News Detection Results');
    window.open(`mailto:?subject=${subject}&body=${text}`, '_blank');
    document.querySelector('.share-dialog')?.remove();
}

// 🎉 INITIALIZATION COMPLETE
console.log('🎉 AI Fake News Detector fully initialized!');

// 📱 MOBILE OPTIMIZATIONS
function setupMobileOptimizations() {
    // Add mobile-specific class to body
    if (window.innerWidth <= 480) {
        document.body.classList.add('mobile-device');
    }
    
    // Improve touch targets on mobile
    if ('ontouchstart' in window) {
        document.body.classList.add('touch-device');
        
        // Enhance button touch experience
        document.querySelectorAll('.btn').forEach(btn => {
            btn.style.minHeight = '44px'; // iOS minimum touch target
            btn.style.minWidth = '44px';
        });
        
        // Prevent double-tap zoom on buttons
        document.querySelectorAll('.btn').forEach(btn => {
            btn.addEventListener('touchend', function(e) {
                e.preventDefault();
                this.click();
            });
        });
        
        // Improve textarea touch experience
        const textarea = document.getElementById('newsText');
        if (textarea) {
            textarea.addEventListener('touchstart', function() {
                this.style.fontSize = '16px'; // Prevent zoom on iOS
            });
        }
    }
    
    // Handle orientation changes
    window.addEventListener('orientationchange', function() {
        setTimeout(() => {
            // Recalculate theme selector position
            const themeSelector = document.querySelector('.theme-selector');
            if (themeSelector) {
                const isMobile = window.innerWidth <= 480;
                themeSelector.style.cssText = `
                    ${isMobile ? 
                        'top: 10px; right: 10px; left: 10px; width: auto; min-width: auto; max-width: none;' : 
                        'top: 20px; right: 20px; min-width: 220px;'
                    }
                    z-index: 1001;
                    border-radius: 15px;
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                `;
            }
            
            // Adjust alert container position
            const alertContainer = document.getElementById('alertContainer');
            if (alertContainer && window.innerWidth <= 480) {
                alertContainer.style.cssText = 'top: 80px; right: 10px; left: 10px; z-index: 9998; max-width: none;';
            }
        }, 100);
    });
    
    // Handle window resize for responsive adjustments
    window.addEventListener('resize', debounce(() => {
        const isMobile = window.innerWidth <= 480;
        
        // Update body class
        if (isMobile) {
            document.body.classList.add('mobile-device');
        } else {
            document.body.classList.remove('mobile-device');
        }
        
        // Update alert container
        const alertContainer = document.getElementById('alertContainer');
        if (alertContainer) {
            if (isMobile) {
                alertContainer.style.cssText = 'top: 80px; right: 10px; left: 10px; z-index: 9998; max-width: none;';
            } else {
                alertContainer.style.cssText = 'top: 80px; right: 20px; z-index: 9998; max-width: 400px;';
            }
        }
    }, 250));
    
    console.log('📱 Mobile optimizations initialized');
}

// Debounce function for performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Update alert container creation for mobile
function getOrCreateAlertContainer() {
    let container = document.getElementById('alertContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'alertContainer';
        container.className = 'position-fixed';
        
        // Mobile-responsive positioning
        const isMobile = window.innerWidth <= 480;
        if (isMobile) {
            container.style.cssText = 'top: 80px; right: 10px; left: 10px; z-index: 9998; max-width: none;';
        } else {
            container.style.cssText = 'top: 80px; right: 20px; z-index: 9998; max-width: 400px;';
        }
        
        document.body.appendChild(container);
    }
    return container;
}

// 🌍 MAKE FUNCTIONS GLOBALLY AVAILABLE
window.clearHistory = clearHistory;
window.removeHistoryItem = removeHistoryItem;
window.reanalyzeText = reanalyzeText;
window.speakResults = speakResults;
window.saveAnalysis = saveAnalysis;
window.shareResult = shareResult;
window.showAlert = showAlert;
window.closeAlert = closeAlert;

// Share helper functions
window.copyToClipboard = copyToClipboard;
window.shareToWhatsApp = shareToWhatsApp;
window.shareToTelegram = shareToTelegram;
window.shareToFacebook = shareToFacebook;
window.shareToTwitter = shareToTwitter;
window.shareToEmail = shareViaEmail;

// 🎉 INITIALIZATION COMPLETE
console.log('🎉 AI Fake News Detector fully initialized!'); 