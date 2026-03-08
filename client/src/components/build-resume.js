// ============================================================
// BUILD RESUME FUNCTIONALITY
// Based on open-resume parsing logic (AGPL licensed)
// ============================================================

(function() {
    'use strict';

    // ============================================================
    // RESUME STATE MANAGEMENT
    // ============================================================
    const STORAGE_KEY = 'domainxai_build_resume_data';
    
    let resumeState = {
        profile: {
            name: '',
            title: '',
            email: '',
            phone: '',
            location: '',
            website: '',
            summary: ''
        },
        workExperiences: [],
        educations: [],
        projects: [],
        skills: [],
        settings: {
            color: '#38bdf8', // sky-400 (default)
            fontFamily: 'Roboto',
            fontSize: 11,
            pageSize: 'A4',
            autoscale: true
        }
    };

    let currentZoom = 100;
    let currentPdfFile = null;

    // ============================================================
    // SETTINGS CONSTANTS (from OpenResume)
    // ============================================================
    const THEME_COLORS = [
        "#f87171", // Red-400
        "#ef4444", // Red-500
        "#fb923c", // Orange-400
        "#f97316", // Orange-500
        "#fbbf24", // Amber-400
        "#f59e0b", // Amber-500
        "#22c55e", // Green-500
        "#15803d", // Green-700
        "#38bdf8", // Sky-400 (default)
        "#0ea5e9", // Sky-500
        "#818cf8", // Indigo-400
        "#6366f1", // Indigo-500
    ];

    const FONT_FAMILIES = [
        "Roboto",
        "Lato",
        "Montserrat",
        "OpenSans",
        "Raleway",
        "Caladea",
        "Lora",
        "RobotoSlab",
        "PlayfairDisplay",
        "Merriweather",
    ];

    const FONT_FAMILY_TO_DISPLAY_NAME = {
        "Roboto": "Roboto",
        "Lato": "Lato",
        "Montserrat": "Montserrat",
        "OpenSans": "Open Sans",
        "Raleway": "Raleway",
        "Caladea": "Caladea",
        "Lora": "Lora",
        "RobotoSlab": "Roboto Slab",
        "PlayfairDisplay": "Playfair Display",
        "Merriweather": "Merriweather",
    };

    const FONT_FAMILY_TO_STANDARD_SIZE = {
        "Roboto": 11,
        "Lato": 11,
        "Montserrat": 10,
        "OpenSans": 10,
        "Raleway": 10,
        "Caladea": 11,
        "Lora": 11,
        "RobotoSlab": 10,
        "PlayfairDisplay": 10,
        "Merriweather": 10,
    };

    const PX_PER_PT = 4 / 3;

    // ============================================================
    // LOCALSTORAGE HELPERS
    // ============================================================
    function loadResumeState() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const loaded = JSON.parse(saved);
                resumeState = loaded;
                // Ensure settings exist
                if (!resumeState.settings) {
                    resumeState.settings = {
                        color: '#38bdf8',
                        fontFamily: 'Roboto',
                        fontSize: 11,
                        pageSize: 'A4',
                        autoscale: true
                    };
                }
                // Ensure autoscale exists
                if (resumeState.settings.autoscale === undefined) {
                    resumeState.settings.autoscale = true;
                }
                return true;
            } catch (e) {
                console.error('Error loading saved state:', e);
            }
        }
        return false;
    }

    function saveResumeState() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(resumeState));
        localStorage.setItem('domainxai_has_used_builder', 'true');
    }
    
    function hasUsedBuilderBefore() {
        return localStorage.getItem('domainxai_has_used_builder') === 'true';
    }

    // ============================================================
    // VIEW SWITCHING
    // ============================================================
    function switchToUploadResume() {
        const uploadView = document.getElementById('view-upload-resume');
        const buildView = document.getElementById('view-build-resume');
        const navUpload = document.getElementById('nav-upload-resume');
        const navBuild = document.getElementById('nav-build-resume');

        if (uploadView) uploadView.classList.remove('hidden');
        if (buildView) buildView.classList.add('hidden');
        
        if (navUpload) {
            navUpload.classList.add('bg-blue-50', 'text-blue-700');
            navUpload.classList.remove('text-slate-600');
        }
        if (navBuild) {
            navBuild.classList.remove('bg-blue-50', 'text-blue-700');
            navBuild.classList.add('text-slate-600');
        }
    }

    function switchToBuildResume() {
        const uploadView = document.getElementById('view-upload-resume');
        const buildView = document.getElementById('view-build-resume');
        const navUpload = document.getElementById('nav-upload-resume');
        const navBuild = document.getElementById('nav-build-resume');

        if (uploadView) uploadView.classList.add('hidden');
        if (buildView) buildView.classList.remove('hidden');
        
        if (navBuild) {
            navBuild.classList.add('bg-blue-50', 'text-blue-700', 'font-medium');
            navBuild.classList.remove('text-slate-600');
        }
        if (navUpload) {
            navUpload.classList.remove('bg-blue-50', 'text-blue-700', 'font-medium');
            navUpload.classList.add('text-slate-600');
        }

        // Show/hide continue section based on saved data
        const continueSection = document.getElementById('continue-section');
        if (continueSection) {
            // Check if there's actual saved data
            const hasData = loadResumeState() && (
                resumeState.profile.name || 
                resumeState.workExperiences.length > 0 || 
                resumeState.educations.length > 0 ||
                resumeState.projects.length > 0 ||
                resumeState.skills.length > 0
            );
            
            // Apply autoscale when switching to build resume
            setTimeout(() => {
                applyAutoScale();
            }, 100);
            
            if (hasData && hasUsedBuilderBefore()) {
                continueSection.style.display = 'block';
            } else {
                continueSection.style.display = 'none';
            }
        }

        // Reset to import screen when switching to build resume
        showImportScreen();
    }

    // ============================================================
    // PDF PARSING (Client-side, based on open-resume)
    // ============================================================
    async function parseResumeFromPdf(fileUrl) {
        try {
            // Step 1: Read PDF
            const textItems = await readPdf(fileUrl);
            
            // Step 2: Group into lines
            const lines = groupTextItemsIntoLines(textItems);
            
            // Step 3: Group into sections
            const sections = groupLinesIntoSections(lines);
            
            // Step 4: Extract resume data (simplified extraction)
            const resume = extractResumeFromSections(sections);
            
            return resume;
        } catch (error) {
            console.error('PDF parsing error:', error);
            throw new Error('Failed to parse PDF. Please ensure it is a single-column resume.');
        }
    }

    async function readPdf(fileUrl) {
        const pdfjs = window.pdfjsLib || window.pdfjs;
        if (typeof pdfjs === 'undefined') {
            throw new Error('PDF.js library not loaded. Please refresh the page.');
        }

        const pdfFile = await pdfjs.getDocument(fileUrl).promise;
        let textItems = [];

        for (let i = 1; i <= pdfFile.numPages; i++) {
            const page = await pdfFile.getPage(i);
            const textContent = await page.getTextContent();
            await page.getOperatorList();
            const commonObjs = page.commonObjs;

            const pageTextItems = textContent.items.map((item) => {
                const { str: text, transform, fontName: pdfFontName, ...otherProps } = item;
                const x = transform[4];
                const y = transform[5];
                const fontObj = commonObjs.get(pdfFontName);
                const fontName = fontObj ? fontObj.name : pdfFontName;
                const newText = text.replace(/-­‐/g, '-');

                return {
                    ...otherProps,
                    fontName,
                    text: newText,
                    x,
                    y,
                };
            });

            textItems.push(...pageTextItems);
        }

        // Filter empty spaces
        textItems = textItems.filter(item => !(!item.hasEOL && item.text.trim() === ''));

        return textItems;
    }

    function groupTextItemsIntoLines(textItems) {
        const lines = [];
        let line = [];

        for (let item of textItems) {
            if (item.hasEOL) {
                if (item.text.trim() !== '') {
                    line.push({ ...item });
                }
                if (line.length > 0) {
                    lines.push(line);
                }
                line = [];
            } else if (item.text.trim() !== '') {
                line.push({ ...item });
            }
        }
        if (line.length > 0) {
            lines.push(line);
        }

        // Merge adjacent items that are close together
        const typicalCharWidth = getTypicalCharWidth(lines.flat());
        for (let line of lines) {
            for (let i = line.length - 1; i > 0; i--) {
                const currentItem = line[i];
                const leftItem = line[i - 1];
                const leftItemXEnd = leftItem.x + (leftItem.width || 0);
                const distance = currentItem.x - leftItemXEnd;
                if (distance <= typicalCharWidth) {
                    if (shouldAddSpaceBetweenText(leftItem.text, currentItem.text)) {
                        leftItem.text += ' ';
                    }
                    leftItem.text += currentItem.text;
                    const currentItemXEnd = currentItem.x + (currentItem.width || 0);
                    leftItem.width = currentItemXEnd - leftItem.x;
                    line.splice(i, 1);
                }
            }
        }

        return lines;
    }

    function getTypicalCharWidth(textItems) {
        textItems = textItems.filter(item => item.text.trim() !== '');
        
        const heightToCount = {};
        let commonHeight = 0;
        let heightMaxCount = 0;
        
        const fontNameToCount = {};
        let commonFontName = '';
        let fontNameMaxCount = 0;

        for (let item of textItems) {
            const { text, height, fontName } = item;
            
            if (!heightToCount[height]) heightToCount[height] = 0;
            heightToCount[height]++;
            if (heightToCount[height] > heightMaxCount) {
                commonHeight = height;
                heightMaxCount = heightToCount[height];
            }

            if (!fontNameToCount[fontName]) fontNameToCount[fontName] = 0;
            fontNameToCount[fontName] += text.length;
            if (fontNameToCount[fontName] > fontNameMaxCount) {
                commonFontName = fontName;
                fontNameMaxCount = fontNameToCount[fontName];
            }
        }

        const commonTextItems = textItems.filter(
            item => item.fontName === commonFontName && item.height === commonHeight
        );
        
        const [totalWidth, numChars] = commonTextItems.reduce(
            (acc, cur) => [acc[0] + (cur.width || 0), acc[1] + cur.text.length],
            [0, 0]
        );
        
        return totalWidth / numChars || 5;
    }

    function shouldAddSpaceBetweenText(leftText, rightText) {
        const leftTextEnd = leftText[leftText.length - 1];
        const rightTextStart = rightText[0];
        const bulletPoints = ['•', '·', '▪', '▫', '-', '*'];
        
        return (
            ([':', ',', '|', '.'].includes(leftTextEnd) && rightTextStart !== ' ') ||
            (leftTextEnd !== ' ' && ['|'].includes(rightTextStart))
        );
    }

    function groupLinesIntoSections(lines) {
        const sections = {};
        let sectionName = 'profile';
        let sectionLines = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const text = line[0]?.text.trim() || '';
            
            if (isSectionTitle(line, i)) {
                sections[sectionName] = [...sectionLines];
                sectionName = text.toLowerCase();
                sectionLines = [];
            } else {
                sectionLines.push(line);
            }
        }
        if (sectionLines.length > 0) {
            sections[sectionName] = [...sectionLines];
        }

        return sections;
    }

    function isSectionTitle(line, lineNumber) {
        if (lineNumber < 2 || line.length > 1 || line.length === 0) {
            return false;
        }

        const textItem = line[0];
        const text = textItem.text.trim();
        const isBold = textItem.fontName && textItem.fontName.toLowerCase().includes('bold');
        const isAllUpperCase = /^[A-Z\s&]+$/.test(text) && /[A-Z]/.test(text);
        const sectionKeywords = ['experience', 'education', 'project', 'skill', 'summary', 'objective'];

        if (isBold && isAllUpperCase) {
            return true;
        }

        const textHasAtMost2Words = text.split(' ').filter(s => s !== '&').length <= 2;
        const startsWithCapital = /[A-Z]/.test(text.slice(0, 1));
        const hasOnlyLetters = /^[A-Za-z\s&]+$/.test(text);

        if (textHasAtMost2Words && hasOnlyLetters && startsWithCapital) {
            return sectionKeywords.some(keyword => text.toLowerCase().includes(keyword));
        }

        return false;
    }

    function extractResumeFromSections(sections) {
        const profile = extractProfile(sections);
        const workExperiences = extractWorkExperience(sections);
        const educations = extractEducation(sections);
        const projects = extractProjects(sections);
        const skills = extractSkills(sections);

        return {
            profile,
            workExperiences,
            educations,
            projects,
            skills: skills.descriptions || []
        };
    }

    function extractProfile(sections) {
        const profileLines = sections.profile || [];
        const allText = profileLines.flat().map(item => item.text).join(' ');

        // Extract email
        const emailMatch = allText.match(/\S+@\S+\.\S+/);
        const email = emailMatch ? emailMatch[0] : '';

        // Extract phone
        const phoneMatch = allText.match(/\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}/);
        const phone = phoneMatch ? phoneMatch[0] : '';

        // Extract location
        const locationMatch = allText.match(/[A-Z][a-zA-Z\s]+, [A-Z]{2}/);
        const location = locationMatch ? locationMatch[0] : '';

        // Extract URL
        const urlMatch = allText.match(/(https?:\/\/|www\.)\S+\.\S+/);
        const website = urlMatch ? urlMatch[0] : '';

        // Name is usually the first bold/large text
        let name = '';
        for (let line of profileLines) {
            if (line.length > 0) {
                const item = line[0];
                const isBold = item.fontName && item.fontName.toLowerCase().includes('bold');
                const isLarge = item.height > 10;
                if (isBold || isLarge) {
                    name = item.text.trim();
                    if (/^[A-Za-z\s\.]+$/.test(name) && name.split(' ').length <= 4) {
                        break;
                    }
                }
            }
        }

        // Summary is usually longer text (4+ words)
        let summary = '';
        for (let line of profileLines) {
            const text = line.map(item => item.text).join(' ').trim();
            if (text.split(' ').length >= 4 && !email && !phone && !location && !website) {
                summary = text;
                break;
            }
        }

        return {
            name: name || '',
            title: '',
            email: email || '',
            phone: phone || '',
            location: location || '',
            website: website || '',
            summary: summary || ''
        };
    }

    function extractWorkExperience(sections) {
        const experiences = [];
        const expSection = sections.experience || sections.work || sections['work experience'] || [];
        
        // Simple extraction: look for company/job patterns
        let currentExp = null;
        for (let line of expSection) {
            const text = line.map(item => item.text).join(' ').trim();
            if (text.length > 0) {
                // Check if it's a date (contains year)
                if (/\d{4}/.test(text)) {
                    if (currentExp) {
                        currentExp.date = text;
                    }
                } else if (text.length > 5 && !text.startsWith('•') && !text.startsWith('-')) {
                    // Likely company or job title
                    if (!currentExp) {
                        currentExp = { company: '', jobTitle: '', date: '', descriptions: [] };
                    } else if (!currentExp.jobTitle) {
                        currentExp.jobTitle = text;
                    } else if (!currentExp.company) {
                        currentExp.company = text;
                    }
                } else if (text.startsWith('•') || text.startsWith('-')) {
                    // Description bullet
                    if (currentExp) {
                        currentExp.descriptions.push(text.replace(/^[•\-]\s*/, ''));
                    }
                }
            }
        }
        
        if (currentExp && currentExp.company) {
            experiences.push(currentExp);
        }

        return experiences.length > 0 ? experiences : [{ company: '', jobTitle: '', date: '', descriptions: [''] }];
    }

    function extractEducation(sections) {
        const educations = [];
        const eduSection = sections.education || [];
        
        // Simple extraction
        let currentEdu = null;
        for (let line of eduSection) {
            const text = line.map(item => item.text).join(' ').trim();
            if (text.length > 0) {
                if (/\d{4}/.test(text)) {
                    if (currentEdu) {
                        currentEdu.date = text;
                    }
                } else if (text.length > 3) {
                    if (!currentEdu) {
                        currentEdu = { school: '', degree: '', date: '', gpa: '', descriptions: [] };
                        currentEdu.degree = text;
                    } else if (!currentEdu.school) {
                        currentEdu.school = text;
                    }
                }
            }
        }
        
        if (currentEdu && currentEdu.degree) {
            educations.push(currentEdu);
        }

        return educations.length > 0 ? educations : [{ school: '', degree: '', date: '', gpa: '', descriptions: [] }];
    }

    function extractProjects(sections) {
        const projects = [];
        const projSection = sections.project || sections.projects || [];
        
        // Simple extraction
        let currentProj = null;
        for (let line of projSection) {
            const text = line.map(item => item.text).join(' ').trim();
            if (text.length > 0) {
                if (/\d{4}/.test(text)) {
                    if (currentProj) {
                        currentProj.date = text;
                    }
                } else if (text.startsWith('•') || text.startsWith('-')) {
                    if (currentProj) {
                        currentProj.descriptions.push(text.replace(/^[•\-]\s*/, ''));
                    }
                } else if (text.length > 3) {
                    if (!currentProj) {
                        currentProj = { project: text, date: '', descriptions: [] };
                    }
                }
            }
        }
        
        if (currentProj && currentProj.project) {
            projects.push(currentProj);
        }

        return projects;
    }

    function extractSkills(sections) {
        const skills = [];
        const skillSection = sections.skill || sections.skills || [];
        
        for (let line of skillSection) {
            const text = line.map(item => item.text).join(' ').trim();
            if (text.length > 0 && !text.startsWith('•') && !text.startsWith('-')) {
                // Split by common delimiters
                const skillList = text.split(/[,;|]/).map(s => s.trim()).filter(s => s.length > 0);
                skills.push(...skillList);
            }
        }

        return { descriptions: skills };
    }

    // ============================================================
    // SETTINGS UI INITIALIZATION
    // ============================================================
    function initializeSettingsUI() {
        const settings = resumeState.settings || {
            color: '#38bdf8',
            fontFamily: 'Roboto',
            fontSize: 11,
            pageSize: 'Letter'
        };

        // Initialize theme color swatches
        const themeColorInput = document.getElementById('theme-color-input');
        if (themeColorInput && !themeColorInput.dataset.initialized) {
            themeColorInput.value = settings.color;
            themeColorInput.dataset.initialized = 'true';
            themeColorInput.addEventListener('input', (e) => {
                resumeState.settings.color = e.target.value;
                saveResumeState();
                updatePreview();
                // Update checkmarks
                document.querySelectorAll('.theme-color-swatch').forEach(s => {
                    const c = s.getAttribute('data-color');
                    const m = s.querySelector('.checkmark');
                    if (c === e.target.value) {
                        m?.classList.remove('hidden');
                    } else {
                        m?.classList.add('hidden');
                    }
                });
            });
        } else if (themeColorInput) {
            themeColorInput.value = settings.color;
        }

        const colorSwatches = document.querySelectorAll('.theme-color-swatch');
        colorSwatches.forEach(swatch => {
            if (swatch.dataset.listenerAdded) return;
            swatch.dataset.listenerAdded = 'true';
            
            const color = swatch.getAttribute('data-color');
            const checkmark = swatch.querySelector('.checkmark');
            
            if (color === settings.color) {
                checkmark?.classList.remove('hidden');
            }

            swatch.addEventListener('click', () => {
                resumeState.settings.color = color;
                const input = document.getElementById('theme-color-input');
                if (input) input.value = color;
                saveResumeState();
                updatePreview();
                
                // Update checkmarks
                document.querySelectorAll('.theme-color-swatch').forEach(s => {
                    const m = s.querySelector('.checkmark');
                    if (s === swatch) {
                        m?.classList.remove('hidden');
                    } else {
                        m?.classList.add('hidden');
                    }
                });
            });
        });

        // Initialize font family selections
        const fontFamilyContainer = document.getElementById('font-family-selections');
        if (fontFamilyContainer) {
            fontFamilyContainer.innerHTML = '';
            FONT_FAMILIES.forEach(font => {
                const isSelected = font === settings.fontFamily;
                const standardSize = FONT_FAMILY_TO_STANDARD_SIZE[font] || 11;
                const fontSizePx = standardSize * PX_PER_PT;
                const displayName = FONT_FAMILY_TO_DISPLAY_NAME[font] || font;
                
                const btn = document.createElement('div');
                btn.className = `font-family-btn flex w-[105px] cursor-pointer items-center justify-center rounded-md border py-1.5 shadow-sm hover:border-gray-400 transition-all`;
                btn.style.fontFamily = font;
                btn.style.fontSize = `${fontSizePx}px`;
                btn.style.borderColor = isSelected ? settings.color : '#d1d5db';
                btn.style.backgroundColor = isSelected ? settings.color : 'transparent';
                btn.style.color = isSelected ? 'white' : '#374151';
                btn.textContent = displayName;
                
                btn.addEventListener('click', () => {
                    resumeState.settings.fontFamily = font;
                    saveResumeState();
                    initializeSettingsUI(); // Re-render to update selections
                    updatePreview();
                });
                
                fontFamilyContainer.appendChild(btn);
            });
        }

        // Initialize font size
        const fontSizeInput = document.getElementById('font-size-input');
        if (fontSizeInput && !fontSizeInput.dataset.initialized) {
            fontSizeInput.value = settings.fontSize;
            fontSizeInput.dataset.initialized = 'true';
            fontSizeInput.addEventListener('input', (e) => {
                resumeState.settings.fontSize = parseInt(e.target.value) || 11;
                saveResumeState();
                initializeSettingsUI(); // Re-render font size buttons
                updatePreview();
            });
        } else if (fontSizeInput) {
            fontSizeInput.value = settings.fontSize;
        }

        // Initialize font size selections
        const fontSizeContainer = document.getElementById('font-size-selections');
        if (fontSizeContainer) {
            fontSizeContainer.innerHTML = '';
            const standardSize = FONT_FAMILY_TO_STANDARD_SIZE[settings.fontFamily] || 11;
            const compactSize = standardSize - 1;
            
            ['Compact', 'Standard', 'Large'].forEach((type, idx) => {
                const fontSizePt = compactSize + idx;
                const isSelected = fontSizePt === settings.fontSize;
                const fontSizePx = fontSizePt * PX_PER_PT;
                
                const btn = document.createElement('div');
                btn.className = `font-size-btn flex w-[105px] cursor-pointer items-center justify-center rounded-md border py-1.5 shadow-sm hover:border-gray-400 transition-all`;
                btn.style.fontFamily = settings.fontFamily;
                btn.style.fontSize = `${fontSizePx}px`;
                btn.style.borderColor = isSelected ? settings.color : '#d1d5db';
                btn.style.backgroundColor = isSelected ? settings.color : 'transparent';
                btn.style.color = isSelected ? 'white' : '#374151';
                btn.textContent = type;
                
                btn.addEventListener('click', () => {
                    resumeState.settings.fontSize = fontSizePt;
                    if (fontSizeInput) fontSizeInput.value = fontSizePt;
                    saveResumeState();
                    initializeSettingsUI(); // Re-render to update selections
                    updatePreview();
                });
                
                fontSizeContainer.appendChild(btn);
            });
        }

        // Initialize document size
        const documentSizeContainer = document.getElementById('document-size-selections');
        if (documentSizeContainer) {
            documentSizeContainer.innerHTML = '';
            ['Letter', 'A4'].forEach(type => {
                const isSelected = type === settings.pageSize;
                
                const btn = document.createElement('div');
                btn.className = `document-size-btn flex w-[105px] cursor-pointer items-center justify-center rounded-md border py-1.5 shadow-sm hover:border-gray-400 transition-all`;
                btn.style.borderColor = isSelected ? settings.color : '#d1d5db';
                btn.style.backgroundColor = isSelected ? settings.color : 'transparent';
                btn.style.color = isSelected ? 'white' : '#374151';
                
                const inner = document.createElement('div');
                inner.className = 'flex flex-col items-center';
                inner.innerHTML = `
                    <div>${type}</div>
                    <div style="font-size: 10px;">${type === 'Letter' ? '(US, Canada)' : '(other countries)'}</div>
                `;
                btn.appendChild(inner);
                
                btn.addEventListener('click', () => {
                    resumeState.settings.pageSize = type;
                    saveResumeState();
                    initializeSettingsUI(); // Re-render to update selections
                    updatePreview();
                });
                
                documentSizeContainer.appendChild(btn);
            });
        }
    }

    // ============================================================
    // FORM POPULATION
    // ============================================================
    function populateForm() {
        // Profile
        document.getElementById('resume-name').value = resumeState.profile.name || '';
        document.getElementById('resume-title').value = resumeState.profile.title || '';
        document.getElementById('resume-email').value = resumeState.profile.email || '';
        document.getElementById('resume-phone').value = resumeState.profile.phone || '';
        document.getElementById('resume-location').value = resumeState.profile.location || '';
        document.getElementById('resume-website').value = resumeState.profile.website || '';
        document.getElementById('resume-summary').value = resumeState.profile.summary || '';

        // Work Experiences
        const expList = document.getElementById('experience-list');
        expList.innerHTML = '';
        resumeState.workExperiences.forEach((exp, idx) => {
            addExperienceItem(exp, idx);
        });

        // Education
        const eduList = document.getElementById('education-list');
        eduList.innerHTML = '';
        resumeState.educations.forEach((edu, idx) => {
            addEducationItem(edu, idx);
        });

        // Projects
        const projList = document.getElementById('project-list');
        projList.innerHTML = '';
        resumeState.projects.forEach((proj, idx) => {
            addProjectItem(proj, idx);
        });

        // Skills
        const skillsList = document.getElementById('skills-list');
        skillsList.innerHTML = '';
        resumeState.skills.forEach(skill => {
            addSkillTag(skill);
        });

        updatePreview();
    }

    // ============================================================
    // FORM ITEM MANAGEMENT
    // ============================================================
    function addExperienceItem(exp = null, idx = null) {
        const expList = document.getElementById('experience-list');
        const index = idx !== null ? idx : resumeState.workExperiences.length;
        
        if (!exp) {
            exp = { company: '', jobTitle: '', date: '', descriptions: [''] };
            resumeState.workExperiences.push(exp);
        }

        const item = document.createElement('div');
        item.className = 'bg-white rounded-xl p-4 border border-slate-200 mb-4';
        item.innerHTML = `
            <button class="float-right text-red-500 hover:text-red-700" onclick="removeExperience(${index})">
                <i class="fa-solid fa-trash"></i>
            </button>
            <input type="text" placeholder="Company" value="${escapeHtml(exp.company || '')}" 
                onchange="updateExperience(${index}, 'company', this.value)" 
                class="w-full mb-2 px-3 py-2 border border-slate-300 rounded-lg">
            <input type="text" placeholder="Job Title" value="${escapeHtml(exp.jobTitle || '')}" 
                onchange="updateExperience(${index}, 'jobTitle', this.value)" 
                class="w-full mb-2 px-3 py-2 border border-slate-300 rounded-lg">
            <input type="text" placeholder="Date (e.g., Jan 2020 - Dec 2022)" value="${escapeHtml(exp.date || '')}" 
                onchange="updateExperience(${index}, 'date', this.value)" 
                class="w-full mb-2 px-3 py-2 border border-slate-300 rounded-lg">
            <textarea placeholder="Description (one per line)" rows="3" 
                onchange="updateExperience(${index}, 'descriptions', this.value.split('\\n').filter(l => l.trim()))" 
                class="w-full px-3 py-2 border border-slate-300 rounded-lg">${(exp.descriptions || []).join('\n')}</textarea>
        `;
        expList.appendChild(item);
        saveResumeState();
    }

    function addEducationItem(edu = null, idx = null) {
        const eduList = document.getElementById('education-list');
        const index = idx !== null ? idx : resumeState.educations.length;
        
        if (!edu) {
            edu = { school: '', degree: '', date: '', gpa: '', descriptions: [] };
            resumeState.educations.push(edu);
        }

        const item = document.createElement('div');
        item.className = 'bg-white rounded-xl p-4 border border-slate-200 mb-4';
        item.innerHTML = `
            <button class="float-right text-red-500 hover:text-red-700" onclick="removeEducation(${index})">
                <i class="fa-solid fa-trash"></i>
            </button>
            <input type="text" placeholder="School" value="${escapeHtml(edu.school || '')}" 
                onchange="updateEducation(${index}, 'school', this.value)" 
                class="w-full mb-2 px-3 py-2 border border-slate-300 rounded-lg">
            <input type="text" placeholder="Degree" value="${escapeHtml(edu.degree || '')}" 
                onchange="updateEducation(${index}, 'degree', this.value)" 
                class="w-full mb-2 px-3 py-2 border border-slate-300 rounded-lg">
            <input type="text" placeholder="Date" value="${escapeHtml(edu.date || '')}" 
                onchange="updateEducation(${index}, 'date', this.value)" 
                class="w-full mb-2 px-3 py-2 border border-slate-300 rounded-lg">
            <input type="text" placeholder="GPA (optional)" value="${escapeHtml(edu.gpa || '')}" 
                onchange="updateEducation(${index}, 'gpa', this.value)" 
                class="w-full mb-2 px-3 py-2 border border-slate-300 rounded-lg">
        `;
        eduList.appendChild(item);
        saveResumeState();
    }

    function addProjectItem(proj = null, idx = null) {
        const projList = document.getElementById('project-list');
        const index = idx !== null ? idx : resumeState.projects.length;
        
        if (!proj) {
            proj = { project: '', date: '', descriptions: [''] };
            resumeState.projects.push(proj);
        }

        const item = document.createElement('div');
        item.className = 'bg-white rounded-xl p-4 border border-slate-200 mb-4';
        item.innerHTML = `
            <button class="float-right text-red-500 hover:text-red-700" onclick="removeProject(${index})">
                <i class="fa-solid fa-trash"></i>
            </button>
            <input type="text" placeholder="Project Name" value="${escapeHtml(proj.project || '')}" 
                onchange="updateProject(${index}, 'project', this.value)" 
                class="w-full mb-2 px-3 py-2 border border-slate-300 rounded-lg">
            <input type="text" placeholder="Date" value="${escapeHtml(proj.date || '')}" 
                onchange="updateProject(${index}, 'date', this.value)" 
                class="w-full mb-2 px-3 py-2 border border-slate-300 rounded-lg">
            <textarea placeholder="Description (one per line)" rows="3" 
                onchange="updateProject(${index}, 'descriptions', this.value.split('\\n').filter(l => l.trim()))" 
                class="w-full px-3 py-2 border border-slate-300 rounded-lg">${(proj.descriptions || []).join('\n')}</textarea>
        `;
        projList.appendChild(item);
        saveResumeState();
    }

    function addSkillTag(skill) {
        if (!skill || !skill.trim()) return;
        const skillsList = document.getElementById('skills-list');
        const tag = document.createElement('span');
        tag.className = 'inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm';
        tag.innerHTML = `
            ${escapeHtml(skill)}
            <button onclick="removeSkill('${escapeHtml(skill)}')" class="text-blue-600 hover:text-blue-800">
                <i class="fa-solid fa-times text-xs"></i>
            </button>
        `;
        skillsList.appendChild(tag);
    }

    // Global functions for inline handlers
    window.updateExperience = function(index, field, value) {
        if (!resumeState.workExperiences[index]) return;
        resumeState.workExperiences[index][field] = value;
        saveResumeState();
        debouncedUpdatePreview();
    };

    window.removeExperience = function(index) {
        resumeState.workExperiences.splice(index, 1);
        saveResumeState();
        populateForm();
        updatePreview();
    };

    window.updateEducation = function(index, field, value) {
        if (!resumeState.educations[index]) return;
        resumeState.educations[index][field] = value;
        saveResumeState();
        debouncedUpdatePreview();
    };

    window.removeEducation = function(index) {
        resumeState.educations.splice(index, 1);
        saveResumeState();
        populateForm();
        updatePreview();
    };

    window.updateProject = function(index, field, value) {
        if (!resumeState.projects[index]) return;
        resumeState.projects[index][field] = value;
        saveResumeState();
        debouncedUpdatePreview();
    };

    window.removeProject = function(index) {
        resumeState.projects.splice(index, 1);
        saveResumeState();
        populateForm();
        updatePreview();
    };

    window.removeSkill = function(skill) {
        resumeState.skills = resumeState.skills.filter(s => s !== skill);
        saveResumeState();
        populateForm();
        updatePreview();
    };

    // ============================================================
    // PREVIEW RENDERING
    // ============================================================
    function updatePreview() {
        const preview = document.getElementById('resume-preview');
        if (!preview) return;

        const { profile, workExperiences, educations, projects, skills, settings } = resumeState;
        const themeColor = settings?.color || '#38bdf8';
        const fontFamily = settings?.fontFamily || 'Roboto';
        const fontSize = settings?.fontSize || 11;
        const pageSize = settings?.pageSize || 'Letter';

        // Always use A4 size for preview (794 × 1123px)
        // The preview sheet must always remain true A4 size
        preview.style.width = '794px';
        preview.style.height = '1123px';
        preview.style.maxWidth = '794px';
        preview.style.minHeight = '1123px';
        preview.style.overflow = 'hidden';
        preview.style.boxSizing = 'border-box';

        // Font size in pixels
        const fontSizePx = fontSize * PX_PER_PT;

        let html = `
            <div style="width: 100%; font-family: '${fontFamily}', sans-serif; font-size: ${fontSizePx}px; line-height: 1.6; color: #171717;">
                <h1 style="font-size: ${fontSizePx * 2.2}px; font-weight: 700; color: #1e293b; margin-bottom: 8px;">${escapeHtml(profile.name || 'Your Name')}</h1>
                <div style="display: flex; flex-wrap: wrap; gap: 12px; font-size: ${fontSizePx * 1.18}px; color: #64748b; margin-bottom: 16px;">
                    ${profile.email ? `<span><i class="fa-solid fa-envelope"></i> ${escapeHtml(profile.email)}</span>` : ''}
                    ${profile.phone ? `<span><i class="fa-solid fa-phone"></i> ${escapeHtml(profile.phone)}</span>` : ''}
                    ${profile.location ? `<span><i class="fa-solid fa-location-dot"></i> ${escapeHtml(profile.location)}</span>` : ''}
                    ${profile.website ? `<span><i class="fa-solid fa-link"></i> ${escapeHtml(profile.website)}</span>` : ''}
                </div>
                ${profile.summary ? `<p style="margin-bottom: 16px; color: #475569; font-size: ${fontSizePx}px;">${escapeHtml(profile.summary)}</p>` : ''}
        `;

        if (workExperiences.length > 0 && workExperiences.some(exp => exp.company || exp.jobTitle)) {
            html += `<h2 style="font-size: ${fontSizePx * 1.64}px; font-weight: 600; color: ${themeColor}; margin-top: 24px; margin-bottom: 12px; border-bottom: 2px solid ${themeColor}; padding-bottom: 4px;">WORK EXPERIENCE</h2>`;
            workExperiences.forEach(exp => {
                if (exp.company || exp.jobTitle) {
                    html += `
                        <div style="margin-bottom: 16px;">
                            <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">
                                <div>
                                    <span style="font-weight: 600; color: #1e293b;">${escapeHtml(exp.jobTitle || 'Job Title')}</span>
                                    ${exp.company ? ` - <span style="font-weight: 600; color: #1e293b;">${escapeHtml(exp.company)}</span>` : ''}
                                </div>
                                ${exp.date ? `<span style="font-size: 13px; color: #64748b;">${escapeHtml(exp.date)}</span>` : ''}
                            </div>
                            ${exp.descriptions && exp.descriptions.length > 0 ? `
                                <ul style="margin-top: 8px; padding-left: 16px;">
                                    ${exp.descriptions.filter(d => d && d.trim()).map(d => `<li style="font-size: ${fontSizePx}px; color: #475569; margin-bottom: 4px;">${escapeHtml(d)}</li>`).join('')}
                                </ul>
                            ` : ''}
                        </div>
                    `;
                }
            });
        }

        if (educations.length > 0 && educations.some(edu => edu.school || edu.degree)) {
            html += `<h2 style="font-size: ${fontSizePx * 1.64}px; font-weight: 600; color: ${themeColor}; margin-top: 24px; margin-bottom: 12px; border-bottom: 2px solid ${themeColor}; padding-bottom: 4px;">EDUCATION</h2>`;
            educations.forEach(edu => {
                if (edu.school || edu.degree) {
                    html += `
                        <div style="margin-bottom: 16px;">
                            <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">
                                <div>
                                    <span style="font-weight: 600; color: #1e293b;">${escapeHtml(edu.degree || 'Degree')}</span>
                                    ${edu.school ? ` - <span style="font-weight: 600; color: #1e293b;">${escapeHtml(edu.school)}</span>` : ''}
                                </div>
                                ${edu.date ? `<span style="font-size: 13px; color: #64748b;">${escapeHtml(edu.date)}</span>` : ''}
                            </div>
                            ${edu.gpa ? `<p style="font-size: ${fontSizePx}px; color: #64748b;">GPA: ${escapeHtml(edu.gpa)}</p>` : ''}
                        </div>
                    `;
                }
            });
        }

        if (projects.length > 0 && projects.some(proj => proj.project)) {
            html += `<h2 style="font-size: ${fontSizePx * 1.64}px; font-weight: 600; color: ${themeColor}; margin-top: 24px; margin-bottom: 12px; border-bottom: 2px solid ${themeColor}; padding-bottom: 4px;">PROJECTS</h2>`;
            projects.forEach(proj => {
                if (proj.project) {
                    html += `
                        <div style="margin-bottom: 16px;">
                            <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">
                                <span style="font-weight: 600; color: #1e293b;">${escapeHtml(proj.project)}</span>
                                ${proj.date ? `<span style="font-size: 13px; color: #64748b;">${escapeHtml(proj.date)}</span>` : ''}
                            </div>
                            ${proj.descriptions && proj.descriptions.length > 0 ? `
                                <ul style="margin-top: 8px; padding-left: 16px;">
                                    ${proj.descriptions.filter(d => d && d.trim()).map(d => `<li style="font-size: ${fontSizePx}px; color: #475569; margin-bottom: 4px;">${escapeHtml(d)}</li>`).join('')}
                                </ul>
                            ` : ''}
                        </div>
                    `;
                }
            });
        }

        if (skills.length > 0) {
            html += `<h2 style="font-size: ${fontSizePx * 1.64}px; font-weight: 600; color: ${themeColor}; margin-top: 24px; margin-bottom: 12px; border-bottom: 2px solid ${themeColor}; padding-bottom: 4px;">SKILLS</h2>`;
            html += `<div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px;">
                ${skills.map(s => `<span style="background: ${themeColor}20; color: ${themeColor}; padding: 4px 12px; border-radius: 12px; font-size: ${fontSizePx * 1.09}px; font-weight: 500;">${escapeHtml(s)}</span>`).join('')}
            </div>`;
        }

        html += '</div>';
        preview.innerHTML = html;
        
        // Apply autoscale after rendering
        setTimeout(() => {
            applyAutoScale();
        }, 0);
    }

    // Debounce preview updates
    let previewTimeout;
    function debouncedUpdatePreview() {
        clearTimeout(previewTimeout);
        previewTimeout = setTimeout(updatePreview, 300);
    }

    // ============================================================
    // ZOOM CONTROLS
    // ============================================================
    // AUTOSCALE FUNCTION
    // ============================================================
    function applyAutoScale() {
        const wrapper = document.getElementById("preview-wrapper");
        const preview = document.getElementById("resume-preview");

        if (!wrapper || !preview) return;
        
        const settings = resumeState.settings || {};
        if (!settings.autoscale) return;

        const wrapperWidth = wrapper.clientWidth;
        const pageWidth = 794;
        const scale = (wrapperWidth / pageWidth) * 0.92; // 8% margin so it doesn't touch edges
        
        preview.style.transform = `scale(${scale})`;
        
        // Update zoom level display
        const zoomLevel = document.getElementById('zoom-level');
        if (zoomLevel) {
            zoomLevel.textContent = Math.round(scale * 100) + '%';
        }
    }

    // ============================================================
    // ZOOM FUNCTION
    // ============================================================
    function updateZoom() {
        const preview = document.getElementById('resume-preview');
        const zoomLevel = document.getElementById('zoom-level');
        const settings = resumeState.settings || {};
        
        if (!preview) return;
        
        // If autoscale is ON, apply autoscale instead of manual zoom
        if (settings.autoscale) {
            applyAutoScale();
            return;
        }
        
        // Manual zoom when autoscale is OFF
        preview.style.transform = `scale(${currentZoom / 100})`;
        
        if (zoomLevel) {
            zoomLevel.textContent = currentZoom + '%';
        }
        
        const slider = document.getElementById('zoom-slider');
        if (slider) {
            slider.value = currentZoom;
        }
    }

    // ============================================================
    // PDF DOWNLOAD
    // ============================================================
    async function downloadResumeAsPdf() {
        const preview = document.getElementById('resume-preview');
        if (!preview) return;

        if (typeof html2canvas === 'undefined' || typeof window.jspdf === 'undefined') {
            alert('PDF generation libraries not loaded. Please refresh the page.');
            return;
        }

        try {
            // Show loading state
            const downloadBtn = document.getElementById('download-resume-btn');
            const originalText = downloadBtn.innerHTML;
            downloadBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating PDF...';
            downloadBtn.disabled = true;

            // Capture the preview as canvas
            const canvas = await html2canvas(preview, {
                scale: 2,
                useCORS: true,
                logging: false
            });

            const imgData = canvas.toDataURL('image/png');
            const { jsPDF } = window.jspdf;
            const settings = resumeState.settings || {
                color: '#38bdf8',
                fontFamily: 'Roboto',
                fontSize: 11,
                pageSize: 'Letter'
            };
            const isA4 = settings.pageSize === 'A4';
            const pdf = new jsPDF('p', 'mm', isA4 ? 'a4' : 'letter');

            // Use settings for page dimensions
            const imgWidth = isA4 ? 210 : 216; // A4: 210mm, Letter: 216mm (8.5in)
            const pageHeight = isA4 ? 297 : 279; // A4: 297mm, Letter: 279mm (11in)
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            pdf.save(`${resumeState.profile.name || 'resume'}-resume.pdf`);

            // Restore button
            downloadBtn.innerHTML = originalText;
            downloadBtn.disabled = false;
        } catch (error) {
            console.error('PDF generation error:', error);
            alert('Failed to generate PDF. Please try again.');
            const downloadBtn = document.getElementById('download-resume-btn');
            if (downloadBtn) {
                downloadBtn.innerHTML = '<i class="fa-solid fa-download"></i> Download Resume (PDF)';
                downloadBtn.disabled = false;
            }
        }
    }

    // ============================================================
    // SCREEN NAVIGATION
    // ============================================================
    function showBuilderView() {
        const importScreen = document.getElementById('build-resume-import-screen');
        const builderView = document.getElementById('build-resume-builder-view');
        
        if (importScreen) importScreen.classList.add('hidden');
        if (builderView) builderView.classList.remove('hidden');
        
        populateForm();
        initializeSettingsUI();
        updatePreview();
        
        // Apply autoscale after view is shown
        setTimeout(() => {
            applyAutoScale();
        }, 100);
    }

    function showImportScreen() {
        const importScreen = document.getElementById('build-resume-import-screen');
        const builderView = document.getElementById('build-resume-builder-view');
        
        if (importScreen) importScreen.classList.remove('hidden');
        if (builderView) builderView.classList.add('hidden');
    }

    // ============================================================
    // EVENT LISTENERS SETUP
    // ============================================================
    function setupEventListeners() {
        // Navigation
        const navUpload = document.getElementById('nav-upload-resume');
        const navBuild = document.getElementById('nav-build-resume');

        if (navUpload) {
            navUpload.addEventListener('click', (e) => {
                e.preventDefault();
                switchToUploadResume();
            });
        }

        if (navBuild) {
            navBuild.addEventListener('click', (e) => {
                e.preventDefault();
                switchToBuildResume();
            });
        }

        // Continue button
        const continueBtn = document.getElementById('continue-btn');
        if (continueBtn) {
            continueBtn.addEventListener('click', () => {
                loadResumeState();
                showBuilderView();
            });
        }

        // Create from scratch button
        const createBtn = document.getElementById('create-from-scratch-btn');
        if (createBtn) {
            createBtn.addEventListener('click', () => {
                resumeState = {
                    profile: { name: '', title: '', email: '', phone: '', location: '', website: '', summary: '' },
                    workExperiences: [],
                    educations: [],
                    projects: [],
                    skills: [],
                    settings: {
                        color: '#38bdf8',
                        fontFamily: 'Roboto',
                        fontSize: 11,
                        pageSize: 'A4',
                        autoscale: true
                    }
                };
                saveResumeState();
                showBuilderView();
            });
        }

        // PDF Dropzone
        const dropzone = document.getElementById('pdf-dropzone');
        const pdfInput = document.getElementById('pdf-file-input');
        const pdfFileInfo = document.getElementById('pdf-file-info');
        const pdfFileName = document.getElementById('pdf-file-name');
        const removePdfBtn = document.getElementById('remove-pdf-btn');
        const importPdfBtn = document.getElementById('import-pdf-btn');

        if (dropzone && pdfInput) {
            // Click to browse
            dropzone.addEventListener('click', () => {
                pdfInput.click();
            });

            // Drag and drop
            dropzone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropzone.classList.add('border-blue-400');
            });

            dropzone.addEventListener('dragleave', () => {
                dropzone.classList.remove('border-blue-400');
            });

            dropzone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropzone.classList.remove('border-blue-400');
                const file = e.dataTransfer.files[0];
                if (file && file.name.endsWith('.pdf')) {
                    handlePdfFile(file);
                } else {
                    alert('Please upload a PDF file.');
                }
            });

            // File input change
            pdfInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file && file.name.endsWith('.pdf')) {
                    handlePdfFile(file);
                } else {
                    alert('Please upload a PDF file.');
                }
            });
        }

        function handlePdfFile(file) {
            currentPdfFile = file;
            const fileUrl = URL.createObjectURL(file);
            
            if (pdfFileInfo) pdfFileInfo.classList.remove('hidden');
            if (pdfFileName) {
                const fileSize = (file.size / 1024).toFixed(2);
                pdfFileName.textContent = `${file.name} - ${fileSize} KB`;
            }

            // Import button handler
            if (importPdfBtn) {
                importPdfBtn.onclick = async () => {
                    try {
                        importPdfBtn.disabled = true;
                        importPdfBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Parsing PDF...';
                        
                        const parsedResume = await parseResumeFromPdf(fileUrl);
                        
                        // Map parsed data to our state structure
                        resumeState = {
                            profile: {
                                name: parsedResume.profile.name || '',
                                title: parsedResume.profile.title || '',
                                email: parsedResume.profile.email || '',
                                phone: parsedResume.profile.phone || '',
                                location: parsedResume.profile.location || '',
                                website: parsedResume.profile.website || '',
                                summary: parsedResume.profile.summary || ''
                            },
                            workExperiences: parsedResume.workExperiences || [],
                            educations: parsedResume.educations || [],
                            projects: parsedResume.projects || [],
                            skills: parsedResume.skills || []
                        };
                        
                        saveResumeState();
                        showBuilderView();
                        
                        URL.revokeObjectURL(fileUrl);
                    } catch (error) {
                        console.error('Import error:', error);
                        alert('Failed to parse PDF: ' + error.message);
                        importPdfBtn.disabled = false;
                        importPdfBtn.innerHTML = 'Import and Continue <i class="fa-solid fa-arrow-right ml-1"></i>';
                    }
                };
            }
        }

        if (removePdfBtn) {
            removePdfBtn.addEventListener('click', () => {
                currentPdfFile = null;
                if (pdfInput) pdfInput.value = '';
                if (pdfFileInfo) pdfFileInfo.classList.add('hidden');
            });
        }

        // Form input listeners
        ['resume-name', 'resume-title', 'resume-email', 'resume-phone', 'resume-location', 'resume-website', 'resume-summary'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', (e) => {
                    const field = id.replace('resume-', '');
                    resumeState.profile[field] = e.target.value;
                    saveResumeState();
                    updatePreview();
                });
            }
        });

        // Add buttons
        document.getElementById('add-experience-btn')?.addEventListener('click', () => {
            addExperienceItem();
            updatePreview();
        });

        document.getElementById('add-education-btn')?.addEventListener('click', () => {
            addEducationItem();
            updatePreview();
        });

        document.getElementById('add-project-btn')?.addEventListener('click', () => {
            addProjectItem();
            updatePreview();
        });

        // Add skill input
        const addSkillInput = document.getElementById('add-skill-input');
        if (addSkillInput) {
            addSkillInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const skill = e.target.value.trim();
                    if (skill && !resumeState.skills.includes(skill)) {
                        resumeState.skills.push(skill);
                        saveResumeState();
                        addSkillTag(skill);
                        e.target.value = '';
                        updatePreview();
                    }
                }
            });
        }

        // Zoom controls
        document.getElementById('zoom-in-btn')?.addEventListener('click', () => {
            currentZoom = Math.min(120, currentZoom + 10);
            updateZoom();
        });

        document.getElementById('zoom-out-btn')?.addEventListener('click', () => {
            currentZoom = Math.max(50, currentZoom - 10);
            updateZoom();
        });

        const zoomSlider = document.getElementById('zoom-slider');
        if (zoomSlider) {
            zoomSlider.addEventListener('input', (e) => {
                currentZoom = parseInt(e.target.value);
                updateZoom();
            });
        }

        // Download button
        document.getElementById('download-resume-btn')?.addEventListener('click', downloadResumeAsPdf);
    }

    // Helper function
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Window resize handler for autoscale
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            applyAutoScale();
        }, 150);
    });

    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setupEventListeners();
            // Load saved state but don't auto-populate unless in builder view
            loadResumeState();
        });
    } else {
        setupEventListeners();
        // Load saved state but don't auto-populate unless in builder view
        loadResumeState();
    }
})();

