class PasswordAnalyzer {
    constructor() {
        this.password = '';
        this.history = [];
        this.commonPasswords = [
            'password123', 'admin123', '12345678', 'qwerty123',
            'letmein', 'welcome1', 'monkey123', 'dragon123'
        ];
        this.commonPatterns = [
            /123/, /abc/, /qwerty/, /password/, /admin/,
            /(.)\1{2,}/, /19\d\d/, /20\d\d/
        ];
        this.init();
    }

    init() {
        this.cacheDomElements();
        this.bindEvents();
        this.loadHistory();
    }

    cacheDomElements() {
        this.passwordInput = document.getElementById('passwordInput');
        this.toggleBtn = document.getElementById('togglePassword');
        this.generateBtn = document.getElementById('generatePassword');
        this.meterFill = document.getElementById('meterFill');
        this.strengthText = document.getElementById('strengthText');
        this.crackTime = document.getElementById('crackTime');
        this.entropyScore = document.getElementById('entropyScore');
        this.charDiversity = document.getElementById('charDiversity');
        this.estimatedCrackTime = document.getElementById('estimatedCrackTime');
        this.historyList = document.getElementById('historyList');
        this.toast = document.getElementById('toast');
    }

    bindEvents() {
        this.passwordInput.addEventListener('input', (e) => this.analyze(e.target.value));
        this.toggleBtn.addEventListener('click', () => this.togglePasswordVisibility());
        this.generateBtn.addEventListener('click', () => this.generateStrongPassword());
        
        // Keyboard shortcut for password generation
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'g') {
                e.preventDefault();
                this.generateStrongPassword();
            }
        });
    }

    analyze(password) {
        this.password = password;
        
        if (!password) {
            this.resetUI();
            return;
        }

        const analysis = this.performAnalysis(password);
        this.updateUI(analysis);
        
        if (password.length >= 4) {
            this.addToHistory(password, analysis.score);
        }
    }

    performAnalysis(password) {
        const checks = {
            length: password.length >= 12,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            numbers: /[0-9]/.test(password),
            special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
            noPatterns: !this.hasCommonPatterns(password),
            highEntropy: this.calculateEntropy(password) > 3.5,
            notBreached: !this.isCommonPassword(password)
        };

        const score = this.calculateScore(checks, password);
        const entropy = this.calculateEntropy(password);
        const diversity = this.calculateCharacterDiversity(password);
        const crackTime = this.estimateCrackTime(password, entropy);

        return {
            checks,
            score,
            entropy,
            diversity,
            crackTime
        };
    }

    calculateScore(checks, password) {
        let score = 0;
        
        // Base score from checks
        Object.values(checks).forEach(passed => {
            if (passed) score += 12.5;
        });

        // Bonus for length
        if (password.length >= 16) score += 10;
        if (password.length >= 20) score += 10;

        // Bonus for mixing character types
        const types = [/[A-Z]/, /[a-z]/, /[0-9]/, /[^A-Za-z0-9]/];
        const typeCount = types.filter(type => type.test(password)).length;
        score += typeCount * 2;

        return Math.min(100, score);
    }

    calculateEntropy(password) {
        let charset = 0;
        if (/[a-z]/.test(password)) charset += 26;
        if (/[A-Z]/.test(password)) charset += 26;
        if (/[0-9]/.test(password)) charset += 10;
        if (/[^A-Za-z0-9]/.test(password)) charset += 33;
        
        return password.length * Math.log2(charset || 1);
    }

    calculateCharacterDiversity(password) {
        const uniqueChars = new Set(password).size;
        return (uniqueChars / password.length * 100).toFixed(1);
    }

    estimateCrackTime(password, entropy) {
        const guessesPerSecond = 1e9; // 1 billion guesses per second (modern GPU)
        const combinations = Math.pow(2, entropy);
        const seconds = combinations / guessesPerSecond;

        if (seconds < 60) return 'Instantly';
        if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
        if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
        if (seconds < 31536000) return `${Math.round(seconds / 86400)} days`;
        if (seconds < 31536000000) return `${Math.round(seconds / 31536000)} years`;
        return 'Centuries';
    }

    hasCommonPatterns(password) {
        return this.commonPatterns.some(pattern => pattern.test(password.toLowerCase()));
    }

    isCommonPassword(password) {
        return this.commonPasswords.includes(password.toLowerCase());
    }

    updateUI(analysis) {
        const { checks, score, entropy, diversity, crackTime } = analysis;

        // Update strength meter
        this.meterFill.style.width = `${score}%`;
        this.updateMeterColor(score);

        // Update strength text
        this.strengthText.textContent = this.getStrengthLabel(score);
        this.crackTime.textContent = `Crack time: ${crackTime}`;

        // Update check cards
        Object.entries(checks).forEach(([check, passed]) => {
            const card = document.getElementById(`${check}Check`);
            if (card) {
                card.className = `analysis-card ${passed ? 'passed' : 'failed'}`;
            }
        });

        // Update detailed stats
        this.entropyScore.textContent = `${entropy.toFixed(2)} bits`;
        this.charDiversity.textContent = `${diversity}%`;
        this.estimatedCrackTime.textContent = crackTime;
    }

    updateMeterColor(score) {
        const meter = this.meterFill;
        if (score < 20) {
            meter.style.background = 'var(--gradient-4)';
        } else if (score < 40) {
            meter.style.background = 'var(--gradient-3)';
        } else if (score < 60) {
            meter.style.background = 'linear-gradient(135deg, #ffd700 0%, #ff8c00 100%)';
        } else if (score < 80) {
            meter.style.background = 'var(--gradient-2)';
        } else {
            meter.style.background = 'var(--gradient-1)';
        }
    }

    getStrengthLabel(score) {
        if (score < 20) return 'Very Weak';
        if (score < 40) return 'Weak';
        if (score < 60) return 'Medium';
        if (score < 80) return 'Strong';
        return 'Very Strong';
    }

    togglePasswordVisibility() {
        const type = this.passwordInput.type === 'password' ? 'text' : 'password';
        this.passwordInput.type = type;
        this.toggleBtn.innerHTML = type === 'password' ? 
            '<i class="fas fa-eye"></i>' : 
            '<i class="fas fa-eye-slash"></i>';
    }

    generateStrongPassword() {
        const length = 16;
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const numbers = '0123456789';
        const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
        
        const allChars = lowercase + uppercase + numbers + special;
        let password = '';
        
        // Ensure at least one of each character type
        password += lowercase[Math.floor(Math.random() * lowercase.length)];
        password += uppercase[Math.floor(Math.random() * uppercase.length)];
        password += numbers[Math.floor(Math.random() * numbers.length)];
        password += special[Math.floor(Math.random() * special.length)];
        
        // Fill the rest with random characters
        for (let i = password.length; i < length; i++) {
            password += allChars[Math.floor(Math.random() * allChars.length)];
        }
        
        // Shuffle the password
        password = password.split('').sort(() => Math.random() - 0.5).join('');
        
        this.passwordInput.value = password;
        this.analyze(password);
        this.showToast('Strong password generated! 🔒');
        
        // Auto copy to clipboard
        navigator.clipboard.writeText(password).then(() => {
            setTimeout(() => this.showToast('Password copied to clipboard! 📋'), 1500);
        });
    }

    addToHistory(password, score) {
        const maskedPassword = password.substring(0, 3) + '*'.repeat(password.length - 3);
        
        this.history.unshift({
            password: maskedPassword,
            strength: this.getStrengthLabel(score),
            score: score,
            timestamp: new Date().toLocaleTimeString()
        });

        // Keep only last 10 entries
        this.history = this.history.slice(0, 10);
        
        this.updateHistoryUI();
        this.saveHistory();
    }

    updateHistoryUI() {
        this.historyList.innerHTML = this.history.map(entry => `
            <div class="history-item">
                <span class="password-preview">${entry.password}</span>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <span class="strength-badge strength-${entry.strength.toLowerCase().replace(' ', '-')}">
                        ${entry.strength}
                    </span>
                    <span style="color: var(--text-secondary); font-size: 0.8rem;">
                        ${entry.timestamp}
                    </span>
                </div>
            </div>
        `).join('');
    }

    saveHistory() {
        try {
            localStorage.setItem('passwordHistory', JSON.stringify(this.history));
        } catch (e) {
            console.warn('Failed to save history:', e);
        }
    }

    loadHistory() {
        try {
            const saved = localStorage.getItem('passwordHistory');
            if (saved) {
                this.history = JSON.parse(saved);
                this.updateHistoryUI();
            }
        } catch (e) {
            console.warn('Failed to load history:', e);
        }
    }

    showToast(message) {
        this.toast.textContent = message;
        this.toast.classList.add('show');
        setTimeout(() => this.toast.classList.remove('show'), 3000);
    }

    resetUI() {
        this.meterFill.style.width = '0';
        this.strengthText.textContent = 'Start typing...';
        this.crackTime.textContent = '';
        this.entropyScore.textContent = '0 bits';
        this.charDiversity.textContent = '0%';
        this.estimatedCrackTime.textContent = 'N/A';
        
        document.querySelectorAll('.analysis-card').forEach(card => {
            card.className = 'analysis-card';
        });
    }
}

// Initialize the analyzer when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PasswordAnalyzer();
});
