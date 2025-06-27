$(document).ready(function() {
    // Load history on page load
    loadHistory();
    
    // Form submission handler
    $('#newsForm').on('submit', function(e) {
        e.preventDefault();
        analyzeNews();
    });
    
    // Refresh history button
    $('#refreshHistory').on('click', function() {
        loadHistory();
    });
    
    function analyzeNews() {
        const newsText = $('#newsText').val().trim();
        
        if (!newsText) {
            showAlert('Please enter some text to analyze.', 'warning');
            return;
        }
        
        // Show loading state
        showLoading(true);
        $('#resultsSection').addClass('d-none');
        
        // Make API request
        $.ajax({
            url: '/api/detect',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                text: newsText
            }),
            success: function(response) {
                displayResults(response);
                loadHistory(); // Refresh history
            },
            error: function(xhr, status, error) {
                let errorMessage = 'An error occurred while analyzing the text.';
                if (xhr.responseJSON && xhr.responseJSON.error) {
                    errorMessage = xhr.responseJSON.error;
                }
                showAlert(errorMessage, 'danger');
            },
            complete: function() {
                showLoading(false);
            }
        });
    }
    
    function displayResults(data) {
        const prediction = data.prediction;
        const confidence = Math.round(data.confidence * 100);
        const sourcesMatched = data.sources_matched;
        
        // Show results section
        $('#resultsSection').removeClass('d-none').addClass('fade-in-up');
        
        // Set prediction result
        const resultDiv = $('#predictionResult');
        let alertClass = prediction === 'fake' ? 'alert-danger' : 'alert-success';
        let icon = prediction === 'fake' ? 'fas fa-exclamation-triangle' : 'fas fa-check-circle';
        let message = prediction === 'fake' ? 'This appears to be FAKE NEWS' : 'This appears to be REAL NEWS';
        
        resultDiv.removeClass().addClass(`alert ${alertClass}`);
        resultDiv.html(`<i class="${icon} me-2"></i><strong>${message}</strong>`);
        
        // Set confidence bar
        const confidenceBar = $('#confidenceBar');
        const confidenceText = $('#confidenceText');
        
        confidenceBar.css('width', confidence + '%');
        confidenceBar.removeClass().addClass('progress-bar');
        
        if (prediction === 'fake') {
            confidenceBar.addClass('bg-danger');
        } else {
            confidenceBar.addClass('bg-success');
        }
        
        confidenceText.text(confidence + '%');
        
        // Display source analysis
        displaySourceAnalysis(sourcesMatched);
    }
    
    function displaySourceAnalysis(sourcesMatched) {
        const sourceDiv = $('#sourceAnalysis');
        let html = '';
        
        if (sourcesMatched.trusted && sourcesMatched.trusted.length > 0) {
            html += '<div class="mb-2"><strong>Trusted Sources Found:</strong></div>';
            sourcesMatched.trusted.forEach(function(source) {
                html += `<span class="source-match trusted">${source.source} (${source.count})</span>`;
            });
        }
        
        if (sourcesMatched.unreliable && sourcesMatched.unreliable.length > 0) {
            html += '<div class="mb-2 mt-2"><strong>Unreliable Sources Found:</strong></div>';
            sourcesMatched.unreliable.forEach(function(source) {
                html += `<span class="source-match unreliable">${source.source} (${source.count})</span>`;
            });
        }
        
        if ((!sourcesMatched.trusted || sourcesMatched.trusted.length === 0) && 
            (!sourcesMatched.unreliable || sourcesMatched.unreliable.length === 0)) {
            html = '<em class="text-muted">No specific sources identified in the text.</em>';
        }
        
        sourceDiv.html(html);
    }
    
    function loadHistory() {
        $.ajax({
            url: '/api/history',
            method: 'GET',
            success: function(data) {
                displayHistory(data);
            },
            error: function() {
                $('#historySection').html('<p class="text-muted">Could not load history.</p>');
            }
        });
    }
    
    function displayHistory(history) {
        const historyDiv = $('#historySection');
        
        if (!history || history.length === 0) {
            historyDiv.html('<p class="text-muted">No analysis history available.</p>');
            return;
        }
        
        let html = '';
        history.slice(0, 10).forEach(function(item) {
            const date = new Date(item.timestamp).toLocaleString();
            const confidence = Math.round(item.confidence * 100);
            const preview = item.text.substring(0, 100) + (item.text.length > 100 ? '...' : '');
            const badgeClass = item.prediction === 'fake' ? 'bg-danger' : 'bg-success';
            const itemClass = item.prediction === 'fake' ? 'fake' : 'real';
            
            html += `
                <div class="history-item ${itemClass}">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <span class="badge ${badgeClass}">${item.prediction.toUpperCase()}</span>
                        <small class="text-muted">${date}</small>
                    </div>
                    <p class="mb-1">${preview}</p>
                    <small class="text-muted">Confidence: ${confidence}%</small>
                </div>
            `;
        });
        
        historyDiv.html(html);
    }
    
    function showLoading(show) {
        const btn = $('#analyzeBtn');
        const loadingIcon = $('#loadingIcon');
        const btnText = $('#btnText');
        
        if (show) {
            btn.prop('disabled', true);
            loadingIcon.removeClass('d-none');
            btnText.text('Analyzing...');
        } else {
            btn.prop('disabled', false);
            loadingIcon.addClass('d-none');
            btnText.text('Analyze News');
        }
    }
    
    function showAlert(message, type) {
        const alertHtml = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        // Insert alert at the top of the main container
        $('.container').prepend(alertHtml);
        
        // Auto-dismiss after 5 seconds
        setTimeout(function() {
            $('.alert').fadeOut();
        }, 5000);
    }
    
    // Auto-resize textarea
    $('#newsText').on('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });
}); 