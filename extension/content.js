// content.js - Oracle Quiz Solver

class OracleQuizSolver {
    constructor() {
        this.isProcessing = false;
        this.autoSolving = false;
        this.quizCompleted = false;
        this.resultsCaptured = false;
        this.questionsAnswered = 0;
        this.viewResultsClicked = false;
        this.navigationClicked = false;
        this.courseOutlineDetected = false;
        this.startButtonClicked = false;
        this.returnButtonClicked = false;
        this.init();
    }
    
    init() {
        console.log('🔧 Oracle Quiz Solver: Inicializado');
        
        // Verificar Course Outline
        if (document.body.innerText.includes('Course Outline') || 
            document.body.innerText.includes('Sections in Course')) {
            console.log('📚 Course Outline detectado');
            this.navigateToNextSection();
        }
        
        // Verificar navegación
        this.checkAndNavigate();
        
        // Verificar pantalla de score
        if (document.body.innerText.includes('PERCENTAGE SCORED') || 
            document.body.innerText.includes('Mastery Score')) {
            console.log('📊 Pantalla de score detectada');
            const viewBtn = document.getElementById('B80081047542606589');
            if (viewBtn) {
                setTimeout(() => viewBtn.click(), 2000);
            }
        }
        
        // Verificar preguntas
        const hasQuestions = this.hasRealQuestions();
        
        if (!hasQuestions) {
            sessionStorage.removeItem('quizSolverAutoSolving');
            this.autoSolving = false;
            console.log('📄 Sin preguntas activas');
        } else {
            const savedAuto = sessionStorage.getItem('quizSolverAutoSolving');
            if (savedAuto === 'true') {
                this.autoSolving = true;
                console.log('🔄 Reanudando auto-resolución...');
                setTimeout(() => this.autoSolveQuiz(), 3000);
            }
        }
        
        this.createControlPanel();
        this.monitorQuizEnd();
        this.monitorNavigationButtons();
        this.monitorReturnButton();
    }
    
    // ============ NAVEGACIÓN ============
    
    async navigateToNextSection() {
        console.log('📚 Buscando siguiente sección...');
        
        const allLinks = document.querySelectorAll('a');
        let targetHref = null;
        
        for (const link of allLinks) {
            const text = link.textContent.trim();
            const sectionMatch = text.match(/Section\s+\d+\s+-\s+/);
            
            if (sectionMatch && !text.includes('100%') && link.offsetParent !== null) {
                targetHref = link.href;
                console.log(`🎯 Siguiente sección: "${text.substring(0, 60)}"`);
                break;
            }
        }
        
        if (targetHref) {
            window.location.href = targetHref;
            return true;
        }
        
        return false;
    }
    
    checkAndNavigate() {
        console.log('🧭 Verificando navegación...');
        
        // 0. Course Outline
        if (document.body.innerText.includes('Course Outline') || 
            document.body.innerText.includes('Sections in Course')) {
            this.navigateToNextSection();
            return;
        }
        
        // 0.1. Verificar si el quiz ya está aprobado
        const takeAssessment = document.getElementById('open_assess_id');
        if (this.isVisible(takeAssessment)) {
            if (this.isQuizAlreadyPassed()) {
                console.log('🎉 Quiz YA APROBADO - Navegando a siguiente sección');
                
                const saveProgressBtn = document.getElementById('B91060267635211656');
                if (this.isVisible(saveProgressBtn)) {
                    saveProgressBtn.click();
                    return;
                }
                
                this.navigateToNextSection();
                return;
            }
            
            console.log('✅ "Take an Assessment" detectado (no aprobado aún)');
            takeAssessment.click();
            return;
        }
        
        // 1. "Start" - PRIORIDAD ABSOLUTA
        const startBtn = document.getElementById('B91021933771211609');
        if (this.isVisible(startBtn)) {
            console.log('🚨 Botón "Start" detectado - PRESIONANDO AHORA');
            startBtn.click();
            
            this.autoSolving = true;
            sessionStorage.setItem('quizSolverAutoSolving', 'true');
            
            setTimeout(() => {
                this.autoSolveQuiz();
            }, 3000);
            return;
        }
        
        // 2. "Save and Continue"
        const saveContinue = document.getElementById('nextModButton');
        if (this.isVisible(saveContinue)) {
            console.log('✅ "Save and Continue" detectado');
            saveContinue.click();
            return;
        }
        
        // 3. "Save Progress"
        const saveProgress = document.getElementById('B91060267635211656');
        if (this.isVisible(saveProgress)) {
            console.log('✅ "Save Progress" detectado');
            saveProgress.click();
            return;
        }
    }
    
    monitorNavigationButtons() {
        const observer = new MutationObserver(() => {
            // 1. Verificar si el quiz ya está aprobado
            const takeAssessment = document.getElementById('open_assess_id');
            if (this.isVisible(takeAssessment) && this.isQuizAlreadyPassed()) {
                console.log('🎉 Quiz YA APROBADO - Navegando');
                const saveProgressBtn = document.getElementById('B91060267635211656');
                if (this.isVisible(saveProgressBtn)) {
                    saveProgressBtn.click();
                }
                return;
            }
            
            // 2. "Start" - PRIORIDAD ABSOLUTA
            const startBtn = document.getElementById('B91021933771211609');
            if (this.isVisible(startBtn) && !this.startButtonClicked) {
                this.startButtonClicked = true;
                console.log('🚨 Botón "Start" detectado - CLICK INMEDIATO');
                
                startBtn.click();
                
                this.autoSolving = true;
                sessionStorage.setItem('quizSolverAutoSolving', 'true');
                
                setTimeout(() => {
                    this.autoSolveQuiz();
                }, 3000);
                return;
            }
            
            // 3. "Take an Assessment"
            if (this.isVisible(takeAssessment)) {
                console.log('👁️ "Take an Assessment" detectado');
                takeAssessment.click();
                return;
            }
            
            // 4. "Save and Continue"
            const saveContinue = document.getElementById('nextModButton');
            if (this.isVisible(saveContinue)) {
                console.log('👁️ "Save and Continue" detectado');
                saveContinue.click();
                return;
            }
            
            // 5. "Save Progress"
            const saveProgress = document.getElementById('B91060267635211656');
            if (this.isVisible(saveProgress) && !this.isVisible(startBtn)) {
                console.log('👁️ "Save Progress" detectado');
                saveProgress.click();
                return;
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true
        });
    }
    
    // ============ MONITOR RETURN ============
    
    monitorReturnButton() {
        console.log('👁️ Monitor de Return to Course Lessons activado');
        
        const observer = new MutationObserver(() => {
            const returnBtn = document.getElementById('B160806923819367698');
            
            if (returnBtn && returnBtn.offsetParent !== null && !this.returnButtonClicked) {
                if (document.body.innerText.includes('Incorrect Question') || 
                    document.body.innerText.includes('Results Summary')) {
                    
                    this.returnButtonClicked = true;
                    console.log('🎯 Botón "Return to Course Lessons" detectado');
                    console.log('   Esperando 5 segundos para guardar errores...');
                    
                    setTimeout(async () => {
                        await this.saveMistakesToKnowledgeBase();
                        
                        console.log('✅ Click en "Return to Course Lessons"');
                        returnBtn.click();
                    }, 5000);
                }
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true
        });
        
        // Verificar inmediatamente también
        setTimeout(() => {
            const returnBtn = document.getElementById('B160806923819367698');
            if (returnBtn && returnBtn.offsetParent !== null && 
                document.body.innerText.includes('Incorrect Question') && 
                !this.returnButtonClicked) {
                
                this.returnButtonClicked = true;
                console.log('🎯 Botón "Return" detectado inmediatamente');
                
                setTimeout(async () => {
                    await this.saveMistakesToKnowledgeBase();
                    console.log('✅ Click en "Return to Course Lessons"');
                    returnBtn.click();
                }, 5000);
            }
        }, 3000);
    }
    
    // ============ DETECCIÓN DE PREGUNTAS ============
    
    hasRealQuestions() {
        const blocks = document.querySelectorAll('.t-ContentBlock-body');
        
        for (const block of blocks) {
            const text = block.textContent.trim();
            
            if (this.isExcludedText(text)) continue;
            
            if (text.length > 15) {
                const options = document.querySelectorAll('button.choice-SelectArea');
                if (options.length >= 2) return true;
            }
        }
        
        return false;
    }
    
    isExcludedText(text) {
        const patterns = [
            'Are you sure', 'If so', 'To review', 'Answer each question',
            'Click Submit Answer', 'If you click Previous', 'Click Complete Assessment',
            'Click Start to begin'
        ];
        return patterns.some(p => text.includes(p));
    }
    
    detectCurrentQuestion() {
        const blocks = document.querySelectorAll('.t-ContentBlock-body');
        
        for (const block of blocks) {
            const text = block.textContent.trim();
            
            if (this.isExcludedText(text)) continue;
            
            if (text.length > 15) {
                const options = this.extractOptions();
                if (options.length >= 2) {
                    return {
                        id: `q_${Date.now()}`,
                        text: text,
                        type: this.detectQuestionType(text),
                        options: options,
                        context: null
                    };
                }
            }
        }
        return null;
    }
    
    extractOptions() {
        const options = [];
        const buttons = document.querySelectorAll('button.choice-SelectArea');
        
        buttons.forEach(btn => {
            const textEl = btn.querySelector('.choice-Text');
            if (textEl && textEl.textContent.trim()) {
                options.push(textEl.textContent.trim());
            }
        });
        
        return options;
    }
    
    detectQuestionType(text) {
        const lower = text.toLowerCase();
        if (lower.includes('true or false')) return 'true_false';
        if (lower.includes('choose') || lower.includes('select all')) return 'multiple_choice';
        return 'single_choice';
    }
    
    // ============ RESOLUCIÓN ============
    
    async autoSolveQuiz() {
        let lastQuestionText = '';
        let stuckCount = 0;
        
        while (this.autoSolving) {
            try {
                // Verificar fin del quiz
                const finalComplete = document.getElementById('B102388866620266126');
                if (this.isVisible(finalComplete) && this.questionsAnswered > 0) {
                    console.log('🏁 Quiz completado');
                    this.autoSolving = false;
                    sessionStorage.removeItem('quizSolverAutoSolving');
                    finalComplete.click();
                    await this.sleep(5000);
                    await this.navigateToResults();
                    break;
                }
                
                // Detectar pregunta
                const question = this.detectCurrentQuestion();
                
                if (!question) {
                    console.log('⚠️ Sin pregunta. Esperando...');
                    await this.sleep(3000);
                    continue;
                }
                
                // Anti-atascamiento
                if (question.text === lastQuestionText) {
                    stuckCount++;
                    if (stuckCount >= 3) {
                        await this.forceAdvance();
                        stuckCount = 0;
                        lastQuestionText = '';
                        continue;
                    }
                } else {
                    stuckCount = 0;
                    lastQuestionText = question.text;
                }
                
                this.questionsAnswered++;
                console.log(`\n📝 Pregunta ${this.questionsAnswered}: ${question.text.substring(0, 60)}...`);
                
                const result = await this.sendToBackend([question]);
                
                if (!result || !result.answers || result.answers.length === 0) {
                    console.log('❌ Sin respuesta');
                    continue;
                }
                
                const answer = result.answers[0];
                console.log(`✅ ${answer.correct_options}`);
                
                await this.selectAnswer(answer.correct_options);
                await this.sleep(500);
                await this.clickSubmitButton();
                await this.sleep(5000);
                
            } catch (error) {
                console.error('❌ Error:', error);
                await this.sleep(3000);
            }
        }
    }
    
    async solveCurrentQuestionFast() {
        if (this.isProcessing) return;
        this.isProcessing = true;
        
        try {
            const question = this.detectCurrentQuestion();
            if (!question) {
                alert('No se detectó pregunta.');
                return;
            }
            
            const result = await this.sendToBackend([question]);
            
            if (result && result.answers && result.answers.length > 0) {
                const answer = result.answers[0];
                console.log('✅ Respuesta:', answer.correct_options);
                this.showAnswerPanel(answer.correct_options);
                await this.selectAnswer(answer.correct_options);
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            this.isProcessing = false;
        }
    }
    
    async selectAnswer(correctAnswers) {
        console.log('🖱️ Seleccionando:', correctAnswers);
        
        const buttons = document.querySelectorAll('button.choice-SelectArea');
        let selected = false;
        
        for (const answer of correctAnswers) {
            const normalizedAnswer = answer.toLowerCase().trim();
            
            for (const btn of buttons) {
                const textEl = btn.querySelector('.choice-Text');
                const btnText = textEl ? textEl.textContent.trim() : '';
                const ariaLabel = (btn.getAttribute('aria-label') || '').trim();
                const normalizedBtnText = btnText.toLowerCase().trim();
                const normalizedAria = ariaLabel.toLowerCase().trim();
                
                const match = 
                    normalizedBtnText === normalizedAnswer ||
                    normalizedAria === normalizedAnswer ||
                    normalizedBtnText.includes(normalizedAnswer) ||
                    normalizedAnswer.includes(normalizedBtnText);
                
                if (match) {
                    console.log(`   ✅ Match: "${btnText}" (aria: "${ariaLabel}")`);
                    
                    btn.click();
                    if (textEl) textEl.click();
                    
                    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
                    btn.dispatchEvent(event);
                    
                    await this.sleep(300);
                    selected = true;
                    break;
                }
            }
        }
        
        if (!selected) {
            console.log('❌ NO SE SELECCIONÓ NINGUNA RESPUESTA');
            console.log('   Respuestas buscadas:', correctAnswers);
            buttons.forEach(btn => {
                const textEl = btn.querySelector('.choice-Text');
                const ariaLabel = btn.getAttribute('aria-label');
                console.log(`   - text: "${textEl?.textContent.trim()}" | aria: "${ariaLabel}"`);
            });
        }
        
        return selected;
    }
    
    async clickSubmitButton() {
        const submitBtn = document.getElementById('quiz-submit');
        if (this.isVisible(submitBtn)) {
            submitBtn.click();
            return true;
        }
        
        const allButtons = document.querySelectorAll('button');
        for (const btn of allButtons) {
            const text = btn.textContent.trim().toLowerCase();
            if (text.includes('submit') && this.isVisible(btn)) {
                btn.click();
                return true;
            }
        }
        return false;
    }
    
    async forceAdvance() {
        const allButtons = document.querySelectorAll('button');
        for (const btn of allButtons) {
            const text = btn.textContent.trim().toLowerCase();
            if ((text.includes('submit') || text.includes('next') || 
                 text.includes('continue') || text.includes('complete')) && 
                this.isVisible(btn)) {
                btn.click();
                return true;
            }
        }
        return false;
    }
    
    // ============ RESULTADOS ============
    
    checkQuizResult() {
        console.log('📊 Verificando resultado del quiz...');
        
        const resultTable = document.querySelector('table[id*="report_table"]:not(#report_table_result-summary)');
        
        if (!resultTable) {
            console.log('⚠️ No se encontró tabla de resultados');
            return { passed: false, score: 0, mastery: 0, status: 'Unknown' };
        }
        
        const tableText = resultTable.textContent;
        const percentages = tableText.match(/(\d+(?:\.\d+)?)\s*%/g);
        
        let score = 0;
        let mastery = 0;
        let status = '';
        
        if (percentages && percentages.length >= 2) {
            score = parseFloat(percentages[0].replace('%', ''));
            mastery = parseFloat(percentages[1].replace('%', ''));
        }
        
        if (tableText.includes('Pass') && !tableText.includes('Fail')) {
            status = 'Pass';
        } else if (tableText.includes('Fail')) {
            status = 'Fail';
        }
        
        const passed = status === 'Pass' || (score > 0 && mastery > 0 && score >= mastery);
        
        console.log(`   Score: ${score}%`);
        console.log(`   Mastery: ${mastery}%`);
        console.log(`   Status: ${status}`);
        console.log(`   Aprobado: ${passed}`);
        
        return { passed, score, mastery, status };
    }
    
    isQuizAlreadyPassed() {
        const bodyText = document.body.innerText;
        
        if (bodyText.includes('Pass') && bodyText.includes('Mastery')) {
            console.log('   Detectado "Pass" en la página');
            return true;
        }
        
        const passElements = Array.from(document.querySelectorAll('*')).filter(el => 
            el.children.length === 0 && el.textContent.trim() === 'Pass'
        );
        
        if (passElements.length > 0) {
            console.log('   Detectado elemento con texto "Pass"');
            return true;
        }
        
        return false;
    }
    
    async navigateToResults() {
        for (let i = 0; i < 25; i++) {
            console.log(`🔄 Intento ${i + 1}/25...`);
            
            const hasIncorrectQuestion = document.body.innerText.includes('Incorrect Question');
            const hasResultsSummary = document.body.innerText.includes('Results Summary');
            const hasResultTable = document.getElementById('report_table_result-summary');
            
            if (hasIncorrectQuestion || hasResultsSummary || hasResultTable) {
                console.log('📊 Página de resultados detectada');
                
                await this.saveMistakesToKnowledgeBase();
                
                const result = this.checkQuizResult();
                console.log(`   Score: ${result.score}% | Mastery: ${result.mastery}% | Passed: ${result.passed}`);
                
                await this.sleep(3000);
                
                const returnBtn = document.getElementById('B160806923819367698');
                if (returnBtn) {
                    console.log('✅ Click en "Return to Course Lessons"');
                    returnBtn.click();
                    return;
                }
                
                const returnByLabel = document.querySelector('button[data-otel-label="RETURN"]');
                if (returnByLabel) {
                    console.log('✅ Click por data-label');
                    returnByLabel.click();
                    return;
                }
                
                console.log('❌ No se encontró botón Return');
                return;
            }
            
            const viewBtn = document.getElementById('B80081047542606589');
            if (this.isVisible(viewBtn)) {
                console.log('👁️ Click en View Results');
                viewBtn.click();
                await this.sleep(5000);
                continue;
            }
            
            await this.sleep(3000);
        }
    }
    
    async captureMistakes() {
        for (let attempt = 0; attempt < 10; attempt++) {
            const table = document.getElementById('report_table_result-summary');
            if (table) {
                await this.processMistakesTable(table);
                return;
            }
            
            const allTables = document.querySelectorAll('table');
            for (const t of allTables) {
                if (t.textContent.includes('Incorrect Question')) {
                    await this.processMistakesTable(t);
                    return;
                }
            }
            
            await this.sleep(2000);
        }
    }
    
    async processMistakesTable(table) {
        const rows = table.querySelectorAll('tbody tr');
        const mistakes = [];
        
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 2) {
                mistakes.push({
                    question: cells[0].textContent.trim(),
                    incorrect_answer: cells[1].textContent.trim()
                });
            }
        });
        
        if (mistakes.length > 0) {
            await this.saveMistakes(mistakes);
        }
    }
    
    async saveMistakes(mistakes) {
        try {
            await fetch('http://localhost:8000/learn', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mistakes: mistakes })
            });
            console.log('💾 Guardadas respuestas incorrectas');
        } catch (error) {
            console.error('Error guardando:', error);
        }
    }
    
    async saveMistakesToKnowledgeBase() {
        console.log('💾 Guardando errores en base de conocimiento...');
        
        const table = document.getElementById('report_table_result-summary');
        if (!table) {
            console.log('⚠️ No se encontró tabla de errores');
            return;
        }
        
        const rows = table.querySelectorAll('tbody tr');
        const mistakes = [];
        
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 2) {
                mistakes.push({
                    question: cells[0].textContent.trim(),
                    incorrect_answer: cells[1].textContent.trim()
                });
            }
        });
        
        if (mistakes.length > 0) {
            try {
                await fetch('http://localhost:8000/learn', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ mistakes: mistakes })
                });
                console.log(`✅ ${mistakes.length} errores guardados`);
            } catch (error) {
                console.error('Error guardando:', error);
            }
        } else {
            console.log('✅ No hay errores para guardar');
        }
    }
    
    // ============ BACKEND ============
    
    async sendToBackend(questions) {
        try {
            const response = await fetch('http://localhost:8000/solve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ questions: questions })
            });
            
            if (!response.ok) throw new Error(`Backend error: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('Backend error:', error);
            return null;
        }
    }
    
    // ============ UI ============
    
    createControlPanel() {
        const existing = document.getElementById('quiz-solver-controls');
        if (existing) existing.remove();
        
        const controls = document.createElement('div');
        controls.id = 'quiz-solver-controls';
        controls.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            z-index: 999998;
            display: flex;
            gap: 10px;
            flex-direction: column;
        `;
        
        const solveButton = document.createElement('button');
        solveButton.textContent = '🧠 Resolver Pregunta';
        solveButton.style.cssText = 'padding: 12px 20px; background: #007bff; color: white; border: none; border-radius: 25px; cursor: pointer; font-weight: bold;';
        solveButton.onclick = () => this.solveCurrentQuestionFast();
        
        const autoButton = document.createElement('button');
        autoButton.id = 'auto-solve-button';
        autoButton.style.cssText = 'padding: 12px 20px; background: #28a745; color: white; border: none; border-radius: 25px; cursor: pointer; font-weight: bold;';
        
        if (this.autoSolving) {
            autoButton.textContent = '⏹️ Detener';
            autoButton.style.background = '#dc3545';
        } else {
            autoButton.textContent = '🚀 Auto-Resolver Quiz';
            autoButton.style.background = '#28a745';
        }
        
        autoButton.onclick = () => {
            if (this.autoSolving) {
                this.autoSolving = false;
                sessionStorage.removeItem('quizSolverAutoSolving');
                autoButton.textContent = '🚀 Auto-Resolver Quiz';
                autoButton.style.background = '#28a745';
            } else {
                this.autoSolving = true;
                sessionStorage.setItem('quizSolverAutoSolving', 'true');
                this.autoSolveQuiz();
                autoButton.textContent = '⏹️ Detener';
                autoButton.style.background = '#dc3545';
            }
        };
        
        controls.appendChild(solveButton);
        controls.appendChild(autoButton);
        document.body.appendChild(controls);
    }
    
    showAnswerPanel(answers) {
        const existing = document.getElementById('quiz-solver-panel');
        if (existing) existing.remove();
        
        const panel = document.createElement('div');
        panel.id = 'quiz-solver-panel';
        panel.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            border: 2px solid #28a745;
            border-radius: 10px;
            padding: 15px;
            z-index: 999999;
        `;
        panel.innerHTML = `<strong>✅ Respuesta:</strong> ${answers.join(', ')}`;
        document.body.appendChild(panel);
        setTimeout(() => panel.remove(), 5000);
    }
    
    monitorQuizEnd() {
        const observer = new MutationObserver(() => {
            const viewBtn = document.getElementById('B80081047542606589');
            if (this.isVisible(viewBtn) && !this.viewResultsClicked) {
                this.viewResultsClicked = true;
                console.log('👁️ Botón View Results detectado');
                setTimeout(() => viewBtn.click(), 2000);
            }
            
            if (document.body.innerText.includes('Incorrect Question') && !this.resultsCaptured) {
                this.resultsCaptured = true;
                console.log('📊 Resultados detectados');
                
                setTimeout(async () => {
                    await this.saveMistakesToKnowledgeBase();
                    
                    setTimeout(() => {
                        const returnBtn = document.getElementById('B160806923819367698');
                        if (returnBtn && returnBtn.offsetParent !== null) {
                            console.log('✅ Click en Return (desde monitorQuizEnd)');
                            returnBtn.click();
                        }
                    }, 3000);
                }, 3000);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true
        });
    }
    
    // ============ UTILIDADES ============
    
    isVisible(el) {
        if (!el) return false;
        if (el.offsetParent === null) return false;
        if (el.disabled === true) return false;
        return true;
    }
    
    findButtonByText(texts) {
        const allButtons = document.querySelectorAll('button, a');
        for (const text of texts) {
            for (const btn of allButtons) {
                if (btn.textContent.trim().toLowerCase().includes(text.toLowerCase()) && 
                    this.isVisible(btn)) {
                    return btn;
                }
            }
        }
        return null;
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Inicializar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new OracleQuizSolver();
    });
} else {
    new OracleQuizSolver();
}