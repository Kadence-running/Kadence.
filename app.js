/* ============================================
   KADENCE — Application JavaScript
   Premium Running Training Platform
   ============================================ */

// ==========================================
// GLOBAL — Navigation & Scroll
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initMobileMenu();
  initScrollReveal();
  initWizard();
  initConseils();
  initPaceDistance();
  loadProfileIfExists();
  autoFillTools();
  initPremium();
});

// Navbar scroll effect
function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  });
}

// Mobile menu
function initMobileMenu() {
  const btn = document.getElementById('mobileMenuBtn');
  const links = document.getElementById('navLinks');
  if (!btn || !links) return;

  btn.addEventListener('click', () => {
    links.classList.toggle('open');
    btn.classList.toggle('open');
  });

  links.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      links.classList.remove('open');
      btn.classList.remove('open');
    });
  });
}

// Scroll reveal animations
function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal');
  if (!reveals.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  reveals.forEach(el => observer.observe(el));
}

// ==========================================
// PROFIL — Wizard Multi-Steps
// ==========================================

let currentStep = 1;
const totalSteps = 6;
let profileData = {
  prenom: '', age: 0, sexe: '', poids: 0, taille: 0,
  niveau: '', objectif: '',
  joursParSemaine: 0, tempsParSeance: 0, fcRepos: 0, fcMax: 0,
  blessures: [],
  terrain: ''
};

function initWizard() {
  const wizard = document.getElementById('wizardContainer');
  if (!wizard) return;

  // Check if profile already exists
  const savedProfile = localStorage.getItem('kadence_profile');
  if (savedProfile) {
    profileData = JSON.parse(savedProfile);
    showProfileSummary();
    return;
  }

  // Option cards (single select)
  ['levelCards', 'objectiveCards', 'terrainCards'].forEach(containerId => {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.querySelectorAll('.option-card').forEach(card => {
      card.addEventListener('click', () => {
        container.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
      });
    });
  });

  // Checkbox cards (multi select)
  const injuryContainer = document.getElementById('injuryCards');
  if (injuryContainer) {
    injuryContainer.querySelectorAll('.checkbox-card').forEach(card => {
      card.addEventListener('click', () => {
        const value = card.dataset.value;
        if (value === 'aucune') {
          injuryContainer.querySelectorAll('.checkbox-card').forEach(c => c.classList.remove('selected'));
          card.classList.toggle('selected');
        } else {
          injuryContainer.querySelector('[data-value="aucune"]')?.classList.remove('selected');
          card.classList.toggle('selected');
        }
      });
    });
  }

  // Navigation buttons
  const nextBtn = document.getElementById('nextBtn');
  const prevBtn = document.getElementById('prevBtn');
  if (nextBtn) nextBtn.addEventListener('click', nextStep);
  if (prevBtn) prevBtn.addEventListener('click', prevStep);
}

function nextStep() {
  if (!validateStep(currentStep)) return;
  saveStepData(currentStep);

  if (currentStep === totalSteps) {
    saveProfile();
    return;
  }

  currentStep++;
  updateWizardUI();
}

function prevStep() {
  if (currentStep <= 1) return;
  currentStep--;
  updateWizardUI();
}

function updateWizardUI() {
  // Update steps visibility
  document.querySelectorAll('.wizard-step').forEach(step => {
    step.classList.toggle('active', parseInt(step.dataset.step) === currentStep);
  });

  // Update indicators
  document.querySelectorAll('.wizard-step-indicator').forEach(ind => {
    const step = parseInt(ind.dataset.step);
    ind.classList.remove('active', 'completed');
    if (step === currentStep) ind.classList.add('active');
    else if (step < currentStep) ind.classList.add('completed');
  });

  // Update connectors
  const connectors = document.querySelectorAll('.wizard-connector');
  connectors.forEach((con, i) => {
    con.classList.toggle('completed', i < currentStep - 1);
  });

  // Show/hide prev button
  const prevBtn = document.getElementById('prevBtn');
  if (prevBtn) prevBtn.style.visibility = currentStep > 1 ? 'visible' : 'hidden';

  // Update next button text
  const nextBtn = document.getElementById('nextBtn');
  if (nextBtn) {
    if (currentStep === totalSteps) {
      nextBtn.innerHTML = 'Enregistrer mon profil <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>';
    } else {
      nextBtn.innerHTML = 'Suivant <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
    }
  }
}

function validateStep(step) {
  switch (step) {
    case 1:
      const prenom = document.getElementById('prenom')?.value.trim();
      const age = parseInt(document.getElementById('age')?.value);
      const poids = parseFloat(document.getElementById('poids')?.value);
      const taille = parseInt(document.getElementById('taille')?.value);
      const sexe = document.getElementById('sexe')?.value;
      if (!prenom || !age || !poids || !taille || !sexe) {
        shakeButton('nextBtn');
        return false;
      }
      return true;
    case 2:
      return !!document.querySelector('#levelCards .option-card.selected') || (shakeButton('nextBtn'), false);
    case 3:
      return !!document.querySelector('#objectiveCards .option-card.selected') || (shakeButton('nextBtn'), false);
    case 4:
      const jours = document.getElementById('joursParSemaine')?.value;
      const temps = document.getElementById('tempsParSeance')?.value;
      if (!jours || !temps) { shakeButton('nextBtn'); return false; }
      return true;
    case 5:
      return true; // Injuries are optional
    case 6:
      return !!document.querySelector('#terrainCards .option-card.selected') || (shakeButton('nextBtn'), false);
    default:
      return true;
  }
}

function shakeButton(btnId) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.style.animation = 'shake 0.4s ease';
  setTimeout(() => btn.style.animation = '', 400);
}

// Add shake keyframe dynamically
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `@keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-8px)} 75%{transform:translateX(8px)} }`;
document.head.appendChild(shakeStyle);

function saveStepData(step) {
  switch (step) {
    case 1:
      profileData.prenom = document.getElementById('prenom').value.trim();
      profileData.age = parseInt(document.getElementById('age').value);
      profileData.sexe = document.getElementById('sexe').value;
      profileData.poids = parseFloat(document.getElementById('poids').value);
      profileData.taille = parseInt(document.getElementById('taille').value);
      break;
    case 2:
      profileData.niveau = document.querySelector('#levelCards .option-card.selected')?.dataset.value || '';
      break;
    case 3:
      profileData.objectif = document.querySelector('#objectiveCards .option-card.selected')?.dataset.value || '';
      break;
    case 4:
      profileData.joursParSemaine = parseInt(document.getElementById('joursParSemaine').value);
      profileData.tempsParSeance = parseInt(document.getElementById('tempsParSeance').value);
      profileData.fcRepos = parseInt(document.getElementById('fcRepos')?.value) || 0;
      profileData.fcMax = parseInt(document.getElementById('fcMax')?.value) || 0;
      break;
    case 5:
      profileData.blessures = Array.from(document.querySelectorAll('#injuryCards .checkbox-card.selected')).map(c => c.dataset.value);
      break;
    case 6:
      profileData.terrain = document.querySelector('#terrainCards .option-card.selected')?.dataset.value || '';
      break;
  }
}

function saveProfile() {
  localStorage.setItem('kadence_profile', JSON.stringify(profileData));
  showProfileSummary();
}

function showProfileSummary() {
  const wizard = document.getElementById('wizardContainer');
  const summary = document.getElementById('profileSummary');
  if (wizard) wizard.style.display = 'none';
  if (!summary) return;
  summary.style.display = 'block';

  const nameEl = document.getElementById('summaryName');
  if (nameEl) nameEl.textContent = profileData.prenom || 'coureur';

  const labels = {
    niveau: { debutant: 'Débutant', intermediaire: 'Intermédiaire', avance: 'Avancé', elite: 'Élite' },
    objectif: { '5k': '5 km', '10k': '10 km', semi: 'Semi-marathon', marathon: 'Marathon', trail: 'Trail', forme: 'Remise en forme' },
    terrain: { route: 'Route', trail: 'Trail / Nature', piste: 'Piste', mixte: 'Mixte' }
  };

  const items = [
    { label: 'Âge', value: `${profileData.age} ans` },
    { label: 'Poids', value: `${profileData.poids} kg` },
    { label: 'Taille', value: `${profileData.taille} cm` },
    { label: 'Niveau', value: labels.niveau[profileData.niveau] || profileData.niveau },
    { label: 'Objectif', value: labels.objectif[profileData.objectif] || profileData.objectif },
    { label: 'Séances / semaine', value: `${profileData.joursParSemaine} jours` },
    { label: 'Temps / séance', value: `${profileData.tempsParSeance} min` },
    { label: 'Terrain', value: labels.terrain[profileData.terrain] || profileData.terrain },
  ];

  if (profileData.fcRepos) items.push({ label: 'FC repos', value: `${profileData.fcRepos} bpm` });
  if (profileData.fcMax) items.push({ label: 'FC max', value: `${profileData.fcMax} bpm` });
  if (profileData.blessures.length > 0 && profileData.blessures[0] !== 'aucune') {
    items.push({ label: 'Blessures', value: profileData.blessures.join(', ') });
  }

  const grid = document.getElementById('profileGrid');
  if (grid) {
    grid.innerHTML = items.map(item => `
      <div class="profile-item">
        <div class="profile-item-label">${item.label}</div>
        <div class="profile-item-value">${item.value}</div>
      </div>
    `).join('');
  }

  // Reset profile button
  const resetBtn = document.getElementById('resetProfileBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      localStorage.removeItem('kadence_profile');
      location.reload();
    });
  }
}

function loadProfileIfExists() {
  const saved = localStorage.getItem('kadence_profile');
  if (saved) {
    profileData = JSON.parse(saved);
  }

  // If on plan page, load plan
  if (document.getElementById('planContent')) {
    if (saved) {
      generateTrainingPlan();
    }
  }
}

// ==========================================
// TRAINING PLAN — Generator
// ==========================================

function generateTrainingPlan() {
  const noProfil = document.getElementById('noProfil');
  const planContent = document.getElementById('planContent');
  if (noProfil) noProfil.style.display = 'none';
  if (planContent) planContent.style.display = 'block';

  const p = profileData;
  const totalWeeks = 12;
  const sessionsPerWeek = p.joursParSemaine || 3;

  // Calculate target pace based on level and objective
  const basePace = calculateBasePace(p);

  // Plan overview
  const overview = document.getElementById('planOverview');
  if (overview) {
    const objectifLabels = { '5k': '5 km', '10k': '10 km', semi: 'Semi-marathon', marathon: 'Marathon', trail: 'Trail', forme: 'Remise en forme' };
    const niveauLabels = { debutant: 'Débutant', intermediaire: 'Intermédiaire', avance: 'Avancé', elite: 'Élite' };
    overview.innerHTML = `
      <div class="plan-stat">
        <div class="plan-stat-value">${totalWeeks}</div>
        <div class="plan-stat-label">Semaines</div>
      </div>
      <div class="plan-stat">
        <div class="plan-stat-value">${sessionsPerWeek}</div>
        <div class="plan-stat-label">Séances / semaine</div>
      </div>
      <div class="plan-stat">
        <div class="plan-stat-value">${objectifLabels[p.objectif] || p.objectif}</div>
        <div class="plan-stat-label">Objectif</div>
      </div>
      <div class="plan-stat">
        <div class="plan-stat-value">${niveauLabels[p.niveau] || p.niveau}</div>
        <div class="plan-stat-label">Niveau</div>
      </div>
      <div class="plan-stat">
        <div class="plan-stat-value">${basePace}</div>
        <div class="plan-stat-label">Allure EF cible (min/km)</div>
      </div>
    `;
  }

  // Generate week tabs
  const weekTabs = document.getElementById('weekTabs');
  if (weekTabs) {
    weekTabs.innerHTML = Array.from({ length: totalWeeks }, (_, i) => {
      const weekNum = i + 1;
      const phase = getPhase(weekNum, totalWeeks);
      return `<button class="week-tab${i === 0 ? ' active' : ''}" data-week="${weekNum}" onclick="selectWeek(${weekNum})">S${weekNum} <span style="font-size:0.7rem;opacity:0.7;">${phase.short}</span></button>`;
    }).join('');
  }

  // Generate week 1 by default
  selectWeek(1);
}

function getPhase(week, totalWeeks) {
  if (week <= Math.floor(totalWeeks * 0.33)) return { name: 'Phase de base', short: '🏗️', desc: 'Construction de l\'endurance fondamentale et habitude de course', icon: '🏗️' };
  if (week <= Math.floor(totalWeeks * 0.75)) return { name: 'Phase de développement', short: '📈', desc: 'Augmentation progressive de l\'intensité et du volume', icon: '📈' };
  if (week <= totalWeeks - 1) return { name: 'Phase d\'affûtage', short: '⚡', desc: 'Réduction du volume, maintien de l\'intensité pour arriver frais', icon: '⚡' };
  return { name: 'Semaine de course', short: '🏁', desc: 'Repos et préparation finale pour le jour J', icon: '🏁' };
}

function selectWeek(weekNum) {
  // Update tabs
  document.querySelectorAll('.week-tab').forEach(tab => {
    tab.classList.toggle('active', parseInt(tab.dataset.week) === weekNum);
  });

  // Update phase indicator
  const phase = getPhase(weekNum, 12);
  const phaseIndicator = document.getElementById('phaseIndicator');
  if (phaseIndicator) {
    phaseIndicator.innerHTML = `
      <div class="phase-indicator-icon">${phase.icon}</div>
      <div class="phase-indicator-text">
        <strong>${phase.name}</strong> — ${phase.desc}
      </div>
    `;
  }

  // Generate sessions for this week
  const sessions = generateWeekSessions(weekNum);
  const container = document.getElementById('trainingDays');
  if (!container) return;

  container.innerHTML = sessions.map((session, i) => {
    const isRest = session.type === 'Repos';
    return `
      <div class="training-day${isRest ? ' rest-day' : ''}" onclick="this.classList.toggle('expanded')">
        <div class="training-day-header">
          <div class="training-day-left">
            <div class="day-badge">J${i + 1}</div>
            <div>
              <div class="session-type">${session.type}</div>
              <div class="session-meta">
                <span>⏱ ${session.duration}</span>
                ${session.pace ? `<span>🏃 ${session.pace}</span>` : ''}
                ${session.zone ? `<span>❤️ ${session.zone}</span>` : ''}
              </div>
            </div>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.4;transition:transform 0.3s;"><path d="M6 9l6 6 6-6"/></svg>
        </div>
        <div class="training-day-body">
          <div class="session-detail">
            <h4>Description</h4>
            <p>${session.description}</p>
          </div>
          ${session.warmup ? `<div class="session-detail"><h4>Échauffement</h4><p>${session.warmup}</p></div>` : ''}
          ${session.mainSet ? `<div class="session-detail"><h4>Corps de séance</h4><p>${session.mainSet}</p></div>` : ''}
          ${session.cooldown ? `<div class="session-detail"><h4>Retour au calme</h4><p>${session.cooldown}</p></div>` : ''}
          ${session.tips ? `<div class="session-detail"><h4>💡 Conseil</h4><p>${session.tips}</p></div>` : ''}
          ${session.zones ? `<div class="session-detail"><h4>Zones cibles</h4><div class="session-zones">${session.zones.map(z => `<span class="zone-badge">${z}</span>`).join('')}</div></div>` : ''}
        </div>
      </div>`;
  }).join('');
}

function calculateBasePace(profile) {
  // Base pace in min/km based on level
  const paceBases = {
    debutant: 7.0,
    intermediaire: 5.75,
    avance: 5.0,
    elite: 4.25
  };
  let pace = paceBases[profile.niveau] || 6.0;

  // Adjust for sex
  if (profile.sexe === 'femme') pace += 0.3;

  // Adjust for age
  if (profile.age > 50) pace += 0.5;
  else if (profile.age > 40) pace += 0.25;
  else if (profile.age < 20) pace -= 0.15;

  const min = Math.floor(pace);
  const sec = Math.round((pace - min) * 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

function generateWeekSessions(weekNum) {
  const p = profileData;
  const sessions = [];
  const daysInWeek = 7;
  const sessionsCount = p.joursParSemaine || 3;
  const isRecoveryWeek = weekNum % 4 === 0;
  const phase = getPhase(weekNum, 12);

  // Determine week progression factor (0.0 to 1.0)
  const progression = Math.min(weekNum / 12, 1);
  const volumeFactor = isRecoveryWeek ? 0.65 : (0.7 + progression * 0.3);

  // Base durations
  const baseDuration = p.tempsParSeance || 45;

  // Session templates based on level and phase
  const sessionTemplates = getSessionTemplates(p, weekNum, baseDuration, volumeFactor, isRecoveryWeek);

  // Distribute sessions across the week
  const restDaysCount = daysInWeek - sessionsCount;
  let sessionIndex = 0;

  for (let day = 0; day < daysInWeek; day++) {
    if (sessionIndex < sessionTemplates.length) {
      // Space sessions with rest days
      sessions.push(sessionTemplates[sessionIndex]);
      sessionIndex++;

      // Add rest day after hard session if available
      if (sessionTemplates[sessionIndex - 1]?.intensity === 'high' && day < daysInWeek - 1) {
        day++;
        sessions.push(createRestDay());
      }
    } else {
      sessions.push(createRestDay());
    }
  }

  // Pad remaining days with rest
  while (sessions.length < 7) {
    sessions.push(createRestDay());
  }

  return sessions.slice(0, 7);
}

function createRestDay() {
  return {
    type: 'Repos',
    duration: '—',
    description: 'Jour de repos complet. Votre corps s\'adapte et progresse pendant la récupération. Vous pouvez faire des étirements légers ou de la marche.',
    tips: 'Profitez-en pour bien dormir (7h30+), bien manger et bien vous hydrater. C\'est un jour aussi important que vos jours d\'entraînement.'
  };
}

function getSessionTemplates(profile, weekNum, baseDuration, volumeFactor, isRecovery) {
  const sessions = [];
  const count = profile.joursParSemaine || 3;
  const level = profile.niveau || 'intermediaire';
  const objective = profile.objectif || '10k';
  const terrain = profile.terrain || 'route';
  const hasInjuries = profile.blessures.length > 0 && profile.blessures[0] !== 'aucune';

  // Calculate allures
  const paceBases = { debutant: 7.0, intermediaire: 5.75, avance: 5.0, elite: 4.25 };
  let efPace = paceBases[level] || 6.0;
  if (profile.sexe === 'femme') efPace += 0.3;
  if (profile.age > 50) efPace += 0.5;
  else if (profile.age > 40) efPace += 0.25;

  const efPaceStr = formatPace(efPace);
  const tempoPace = formatPace(efPace - 0.75);
  const thresholdPace = formatPace(efPace - 1.25);
  const intervalPace = formatPace(efPace - 1.75);

  // Always include EF run
  const efDuration = Math.round(baseDuration * volumeFactor);
  sessions.push({
    type: 'Endurance Fondamentale',
    duration: `${efDuration} min`,
    pace: `${efPaceStr} /km`,
    zone: 'Zone 2',
    intensity: 'low',
    description: `Course facile en aisance respiratoire. Vous devez pouvoir tenir une conversation sans difficulté. C'est la base de votre progression — ne sous-estimez pas ces séances !`,
    tips: terrain === 'trail' ? 'En trail, adaptez l\'allure aux montées sans regarder le chrono. Fiez-vous à votre respiration et votre fréquence cardiaque.' : 'Résistez à l\'envie d\'accélérer ! C\'est la séance la plus importante de la semaine. 80% de votre entraînement doit être en zone 2.',
    zones: ['Zone 2 (60-70% FCR)']
  });

  if (count >= 2) {
    // Long run
    const longDuration = Math.round(baseDuration * volumeFactor * (objective === 'marathon' ? 1.8 : objective === 'semi' ? 1.5 : 1.3));
    const longPace = formatPace(efPace + 0.25);

    sessions.push({
      type: 'Sortie Longue',
      duration: `${Math.min(longDuration, isRecovery ? 60 : 150)} min`,
      pace: `${longPace} /km`,
      zone: 'Zone 1-2',
      intensity: 'moderate',
      description: `Sortie longue à allure confortable. L'objectif est d'habituer votre corps à courir longtemps, pas vite. ${objective === 'marathon' || objective === 'semi' ? 'Cette séance est cruciale pour votre préparation longue distance.' : 'Elle développe votre endurance aérobie et votre capacité à utiliser les graisses.'}`,
      warmup: '10 min de marche puis footing très lent',
      cooldown: '5-10 min de marche + étirements',
      tips: `Emportez de l'eau si > 1h. ${objective === 'marathon' ? 'Testez votre ravitaillement course (gels, barres) pendant cette séance.' : 'Hydratez-vous régulièrement, même si vous n\'avez pas soif.'}`,
      zones: ['Zone 1-2 (55-70% FCR)']
    });
  }

  if (count >= 3) {
    // Quality session based on phase and level
    if (isRecovery) {
      sessions.push({
        type: 'Fartlek léger',
        duration: `${Math.round(baseDuration * 0.7)} min`,
        pace: 'Varié',
        zone: 'Zone 2-3',
        intensity: 'low',
        description: 'Fartlek de récupération : petites accélérations de 30s au ressenti dans votre footing, suivies de 1-2 min de récupération facile. L\'effort reste contrôlé.',
        warmup: '10 min de footing progressif',
        mainSet: '6-8 × 30s en accélération progressive (pas de sprint) / 1min30 récupération footing',
        cooldown: '10 min de footing lent + étirements',
        tips: 'C\'est une semaine de récupération. L\'objectif est de garder le contact avec la vitesse sans forcer. Aucune accélération ne doit être maximale.',
        zones: ['Zone 2-3 (65-80% FCR)']
      });
    } else if (weekNum <= 4) {
      // Base phase: Fartlek / tempo
      sessions.push({
        type: 'Fartlek',
        duration: `${Math.round(baseDuration * volumeFactor)} min`,
        pace: 'Varié',
        zone: 'Zone 2-4',
        intensity: 'moderate',
        description: `Jeu de vitesse : alternez entre allure footing et accélérations progressives. Le fartlek développe la capacité à changer de rythme et améliore votre VO2max en douceur.`,
        warmup: '15 min de footing progressif + éducatifs (montées de genoux, talons-fesses)',
        mainSet: level === 'debutant' ? '8 × 30s vite / 1min30 lent' : level === 'intermediaire' ? '10 × 1min vite / 1min lent' : '12 × 1min vite / 45s lent',
        cooldown: '10 min de footing lent + étirements',
        tips: 'Le fartlek se fait au ressenti, pas au chrono. L\'effort des accélérations doit être soutenu mais jamais un sprint. Vous devez pouvoir enchaîner toutes les répétitions.',
        zones: ['Zone 2 (récup)', 'Zone 3-4 (accél.)']
      });
    } else if (weekNum <= 9) {
      // Development phase: intervals
      const intervals = generateIntervals(level, weekNum, objective);
      sessions.push({
        type: `Fractionné ${intervals.format}`,
        duration: `${Math.round(baseDuration * volumeFactor)} min`,
        pace: `${intervalPace} /km (effort)`,
        zone: 'Zone 4-5',
        intensity: 'high',
        description: `Séance clé de la semaine. Le fractionné améliore votre VMA (Vitesse Maximale Aérobie) et développe votre capacité anaérobie. ${hasInjuries ? '⚠️ Attention : compte tenu de vos antécédents, restez sur les fourchettes basses si douleur.' : ''}`,
        warmup: '15 min de footing progressif + 3-4 lignes droites en accélération + éducatifs',
        mainSet: intervals.detail,
        cooldown: '10-15 min de footing très lent + étirements approfondis',
        tips: terrain === 'piste' ? `Idéale sur piste pour le contrôle de la distance. Visez une allure régulière sur chaque répétition — les 2 dernières doivent être au même rythme que les premières.` : `Si pas de piste, trouvez un terrain plat. L'important est la régularité de l'effort, pas la vitesse absolue.`,
        zones: ['Zone 4-5 (85-95% FCR)']
      });
    } else {
      // Taper phase: specific pace
      sessions.push({
        type: 'Allure Spécifique',
        duration: `${Math.round(baseDuration * 0.8)} min`,
        pace: `${tempoPace} /km`,
        zone: 'Zone 3-4',
        intensity: 'moderate',
        description: `Course à l'allure cible de votre objectif ${objective}. C'est le moment de calibrer votre rythme de course et de confirmer vos sensations.`,
        warmup: '15 min de footing + éducatifs',
        mainSet: `${level === 'debutant' ? '2 × 8' : level === 'intermediaire' ? '3 × 8' : '2 × 15'} min à allure spécifique / 2 min récup footing entre chaque bloc`,
        cooldown: '10 min de footing lent + étirements',
        tips: 'Mémorisez vos sensations à cette allure : respiration, foulée, posture. C\'est exactement ce que vous devrez reproduire le jour J.',
        zones: ['Zone 3-4 (75-88% FCR)']
      });
    }
  }

  if (count >= 4) {
    // Second EF
    sessions.push({
      type: 'Endurance Fondamentale',
      duration: `${Math.round(baseDuration * volumeFactor * 0.8)} min`,
      pace: `${efPaceStr} /km`,
      zone: 'Zone 2',
      intensity: 'low',
      description: 'Deuxième sortie facile de la semaine. Même principe : allure conversationnelle, plaisir de courir. Variez le parcours pour le mental.',
      tips: hasInjuries ? 'Écoutez votre corps. Si une douleur apparaît, passez en marche. Mieux vaut écourter une séance que risquer une blessure.' : 'Essayez un nouveau parcours ou emmenez quelqu\'un qui débute. Partager la passion, c\'est aussi s\'entraîner.',
      zones: ['Zone 2 (60-70% FCR)']
    });
  }

  if (count >= 5) {
    // Cross-training or active recovery
    sessions.push({
      type: 'Cross-training ou récup active',
      duration: `${Math.round(baseDuration * 0.6)} min`,
      pace: '—',
      zone: 'Zone 1-2',
      intensity: 'low',
      description: 'Séance croisée : vélo, natation, marche rapide, yoga, ou renforcement musculaire. L\'objectif est de faire travailler le cardio sans l\'impact de la course.',
      tips: 'Le renforcement musculaire (gainage, squats, fentes) 2× par semaine réduit le risque de blessure de 50%. Intégrez-le ici.',
      zones: ['Zone 1-2 (50-65% FCR)']
    });
  }

  if (count >= 6) {
    sessions.push({
      type: 'Footing récupération',
      duration: `${Math.round(baseDuration * 0.5)} min`,
      pace: `${formatPace(efPace + 0.5)} /km`,
      zone: 'Zone 1',
      intensity: 'low',
      description: 'Footing très lent de décrassage. L\'objectif est uniquement de faire circuler le sang pour favoriser la récupération, pas de s\'entraîner.',
      tips: 'Si vous vous sentez fatigué(e), transformez en marche rapide. C\'est parfaitement acceptable et tout aussi bénéfique.',
      zones: ['Zone 1 (50-60% FCR)']
    });
  }

  return sessions;
}

function generateIntervals(level, weekNum, objective) {
  const formats = {
    debutant: [
      { format: '30/30', detail: '10 × 30s rapide / 30s marche ou footing lent' },
      { format: '200m', detail: '8 × 200m vite / 200m récup footing' },
      { format: '400m', detail: '6 × 400m / 1min30 récup footing' },
    ],
    intermediaire: [
      { format: '400m', detail: '8 × 400m / 1min15 récup footing' },
      { format: '500m', detail: '6 × 500m / 1min30 récup footing' },
      { format: '1000m', detail: '5 × 1000m / 2min récup footing' },
    ],
    avance: [
      { format: '1000m', detail: '6 × 1000m / 1min30 récup footing' },
      { format: '2000m', detail: '3 × 2000m / 2min30 récup footing' },
      { format: 'pyramide', detail: '400m - 800m - 1200m - 1600m - 1200m - 800m - 400m / récup = 50% du temps d\'effort' },
    ],
    elite: [
      { format: '1000m', detail: '8 × 1000m / 1min récup footing' },
      { format: '2000m', detail: '4 × 2000m / 2min récup footing' },
      { format: 'pyramide', detail: '800m - 1200m - 1600m - 2000m - 1600m - 1200m - 800m / récup = 50% du temps d\'effort' },
    ]
  };

  const options = formats[level] || formats.intermediaire;
  const index = (weekNum - 5) % options.length;
  return options[index];
}

function formatPace(paceDecimal) {
  const min = Math.floor(paceDecimal);
  const sec = Math.round((paceDecimal - min) * 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

// ==========================================
// CONSEILS — Tab Navigation
// ==========================================

function initConseils() {
  const nav = document.getElementById('conseilsNav');
  if (!nav) return;

  nav.querySelectorAll('.conseil-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const category = tab.dataset.category;
      // Update tabs
      nav.querySelectorAll('.conseil-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      // Update sections
      document.querySelectorAll('.conseil-section').forEach(section => {
        section.classList.toggle('active', section.dataset.category === category);
      });
      // Trigger reveal animations
      document.querySelectorAll('.conseil-section.active .reveal').forEach(el => {
        el.classList.remove('visible');
        setTimeout(() => el.classList.add('visible'), 50);
      });
    });
  });

  // Initialize reveal on active section
  setTimeout(() => {
    document.querySelectorAll('.conseil-section.active .reveal').forEach(el => {
      el.classList.add('visible');
    });
  }, 100);
}

// ==========================================
// OUTILS — Calculators
// ==========================================

function initPaceDistance() {
  const paceDistanceSelect = document.getElementById('paceDistance');
  const customGroup = document.getElementById('customDistanceGroup');
  if (!paceDistanceSelect || !customGroup) return;

  paceDistanceSelect.addEventListener('change', () => {
    customGroup.style.display = paceDistanceSelect.value === 'custom' ? 'block' : 'none';
  });

  // Live conversion pace <-> speed
  const paceMinInput = document.getElementById('paceMin');
  const paceSecInput = document.getElementById('paceSec');
  const speedInput = document.getElementById('speedKmh');

  const convertPaceToSpeed = () => {
    const min = parseInt(paceMinInput?.value) || 0;
    const sec = parseInt(paceSecInput?.value) || 0;
    if (min > 0 || sec > 0) {
      const totalMin = min + sec / 60;
      const speed = 60 / totalMin;
      if (speedInput) speedInput.value = speed.toFixed(1);
    }
  };

  const convertSpeedToPace = () => {
    const speed = parseFloat(speedInput?.value);
    if (speed > 0) {
      const totalMin = 60 / speed;
      const min = Math.floor(totalMin);
      const sec = Math.round((totalMin - min) * 60);
      if (paceMinInput) paceMinInput.value = min;
      if (paceSecInput) paceSecInput.value = sec;
    }
  };

  paceMinInput?.addEventListener('input', convertPaceToSpeed);
  paceSecInput?.addEventListener('input', convertPaceToSpeed);
  speedInput?.addEventListener('input', convertSpeedToPace);
}

function calculatePace() {
  const min = parseInt(document.getElementById('paceMin')?.value) || 0;
  const sec = parseInt(document.getElementById('paceSec')?.value) || 0;
  const speedInput = parseFloat(document.getElementById('speedKmh')?.value);

  let paceMinPerKm = min + sec / 60;
  if (paceMinPerKm <= 0 && speedInput > 0) {
    paceMinPerKm = 60 / speedInput;
  }

  if (paceMinPerKm <= 0) return;

  let distance = parseFloat(document.getElementById('paceDistance')?.value);
  if (document.getElementById('paceDistance')?.value === 'custom') {
    distance = parseFloat(document.getElementById('customDistance')?.value);
  }

  if (!distance || distance <= 0) return;

  const totalMinutes = paceMinPerKm * distance;
  const hours = Math.floor(totalMinutes / 60);
  const mins = Math.floor(totalMinutes % 60);
  const secs = Math.round((totalMinutes - Math.floor(totalMinutes)) * 60);

  const speed = (60 / paceMinPerKm).toFixed(1);
  const paceStr = `${Math.floor(paceMinPerKm)}:${Math.round((paceMinPerKm % 1) * 60).toString().padStart(2, '0')}`;

  const resultEl = document.getElementById('paceResult');
  const valueEl = document.getElementById('paceResultValue');
  const detailEl = document.getElementById('paceResultDetail');

  if (resultEl) resultEl.style.display = 'flex';
  if (valueEl) valueEl.textContent = hours > 0 ? `${hours}h ${mins.toString().padStart(2, '0')}min ${secs.toString().padStart(2, '0')}s` : `${mins}min ${secs.toString().padStart(2, '0')}s`;
  if (detailEl) detailEl.textContent = `${distance} km à ${paceStr} /km (${speed} km/h)`;
}

function calculateHRZones() {
  const age = parseInt(document.getElementById('hrAge')?.value);
  const restHR = parseInt(document.getElementById('hrRest')?.value);
  let maxHR = parseInt(document.getElementById('hrMax')?.value);

  if (!age || !restHR) return;

  if (!maxHR) maxHR = 220 - age;

  const reserveHR = maxHR - restHR;

  const zones = [
    { name: 'Zone 1 — Récupération', min: 0.50, max: 0.60, color: '#4CAF50', desc: 'Marche rapide, échauffement' },
    { name: 'Zone 2 — Endurance', min: 0.60, max: 0.70, color: '#69F0AE', desc: 'Endurance fondamentale' },
    { name: 'Zone 3 — Tempo', min: 0.70, max: 0.80, color: '#FFD54F', desc: 'Allure marathon, seuil aérobie' },
    { name: 'Zone 4 — Seuil', min: 0.80, max: 0.90, color: '#FF9800', desc: 'Seuil anaérobie, fractionné long' },
    { name: 'Zone 5 — VO2max', min: 0.90, max: 1.00, color: '#F44336', desc: 'Fractionné court, sprint' },
  ];

  const display = document.getElementById('zonesDisplay');
  if (!display) return;
  display.style.display = 'block';

  display.innerHTML = `
    <div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:var(--space-md);">
      FC max : ${maxHR} bpm · FC repos : ${restHR} bpm · FC réserve : ${reserveHR} bpm
    </div>
    ${zones.map(zone => {
    const minBPM = Math.round(restHR + reserveHR * zone.min);
    const maxBPM = Math.round(restHR + reserveHR * zone.max);
    const widthPercent = zone.max * 100;
    return `
        <div class="zone-row">
          <div class="zone-label" style="color:${zone.color};">${zone.name.split('—')[0].trim()}</div>
          <div class="zone-bar">
            <div class="zone-bar-fill" style="width:${widthPercent}%;background:${zone.color};"></div>
          </div>
          <div class="zone-range">${minBPM} - ${maxBPM} bpm</div>
        </div>
        <div style="font-size:0.75rem;color:var(--text-muted);padding:2px 0 8px 0;">${zone.name.split('—')[1]?.trim() || ''} — ${zone.desc}</div>
      `;
  }).join('')}
    <div class="conseil-tip" style="margin-top:var(--space-md);">
      <strong>💡 Méthode Karvonen :</strong> FC cible = FC repos + (FC réserve × % d'intensité). Cette méthode est plus précise que le simple % de FC max car elle tient compte de votre condition physique au repos.
    </div>
  `;
}

function predictPerformance() {
  const refDist = parseFloat(document.getElementById('refDistance')?.value);
  const hours = parseInt(document.getElementById('refHours')?.value) || 0;
  const minutes = parseInt(document.getElementById('refMinutes')?.value) || 0;
  const seconds = parseInt(document.getElementById('refSeconds')?.value) || 0;
  const targetDist = parseFloat(document.getElementById('targetDistance')?.value);

  const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  if (!refDist || !targetDist || totalSeconds <= 0) return;

  // Riegel formula: T2 = T1 × (D2/D1)^1.06
  const predictedSeconds = totalSeconds * Math.pow(targetDist / refDist, 1.06);

  const pH = Math.floor(predictedSeconds / 3600);
  const pM = Math.floor((predictedSeconds % 3600) / 60);
  const pS = Math.round(predictedSeconds % 60);

  const pace = predictedSeconds / 60 / targetDist;
  const paceMin = Math.floor(pace);
  const paceSec = Math.round((pace - paceMin) * 60);

  const distLabels = { 5: '5 km', 10: '10 km', 21.1: 'Semi-marathon', 42.195: 'Marathon' };

  const resultEl = document.getElementById('predictResult');
  const valueEl = document.getElementById('predictResultValue');
  const detailEl = document.getElementById('predictResultDetail');

  if (resultEl) resultEl.style.display = 'flex';
  if (valueEl) valueEl.textContent = pH > 0 ? `${pH}h ${pM.toString().padStart(2, '0')}min ${pS.toString().padStart(2, '0')}s` : `${pM}min ${pS.toString().padStart(2, '0')}s`;
  if (detailEl) detailEl.textContent = `Temps prédit sur ${distLabels[targetDist] || targetDist + ' km'} → Allure : ${paceMin}:${paceSec.toString().padStart(2, '0')} /km`;
}

function calculateBMI() {
  const weight = parseFloat(document.getElementById('bmiWeight')?.value);
  const heightCm = parseFloat(document.getElementById('bmiHeight')?.value);

  if (!weight || !heightCm) return;

  const heightM = heightCm / 100;
  const bmi = weight / (heightM * heightM);

  let category, detail, color;
  if (bmi < 18.5) {
    category = 'Insuffisance pondérale';
    detail = 'Attention : un poids trop faible peut compromettre votre système immunitaire et augmenter le risque de fracture de fatigue. Consultez un nutritionniste du sport.';
    color = '#64B5F6';
  } else if (bmi < 20) {
    category = 'Poids léger — optimal coureur';
    detail = 'Zone idéale pour les coureurs de fond. Votre ratio puissance/poids est excellent. Assurez-vous de consommer suffisamment de calories et de fer.';
    color = '#69F0AE';
  } else if (bmi < 22.5) {
    category = 'Poids idéal coureur';
    detail = 'Excellent ! C\'est la fourchette optimale pour la performance en course à pied, combinant puissance musculaire et légèreté.';
    color = '#00C853';
  } else if (bmi < 25) {
    category = 'Poids normal';
    detail = 'IMC dans la norme. Pour progresser en course, une légère optimisation de la composition corporelle (plus de muscle, moins de gras) pourrait aider, mais ce n\'est pas prioritaire.';
    color = '#FFD54F';
  } else if (bmi < 30) {
    category = 'Surpoids';
    detail = 'Attention aux articulations ! Augmentez progressivement le volume (+10%/semaine max). Alternez course/marche au début. Le renforcement musculaire est votre meilleur allié.';
    color = '#FF9800';
  } else {
    category = 'Obésité';
    detail = 'Privilégiez la marche rapide et le vélo avant de courir régulièrement. Commencez par des séances de marche/course alternées. Consultez un médecin du sport avant de débuter.';
    color = '#F44336';
  }

  const resultEl = document.getElementById('bmiResult');
  const valueEl = document.getElementById('bmiResultValue');
  const labelEl = document.getElementById('bmiResultLabel');
  const detailEl = document.getElementById('bmiResultDetail');

  if (resultEl) resultEl.style.display = 'flex';
  if (valueEl) {
    valueEl.textContent = bmi.toFixed(1);
    valueEl.style.background = 'none';
    valueEl.style.webkitTextFillColor = color;
    valueEl.style.color = color;
  }
  if (labelEl) {
    labelEl.textContent = category;
    labelEl.style.color = color;
  }
  if (detailEl) detailEl.textContent = detail;
}

function calculateCalories() {
  const weight = parseFloat(document.getElementById('calWeight')?.value);
  const distance = parseFloat(document.getElementById('calDistance')?.value);
  const terrainFactor = parseFloat(document.getElementById('calTerrain')?.value) || 1.0;

  if (!weight || !distance) return;

  // Calories ≈ 1.036 × weight (kg) × distance (km) × terrain factor
  const calories = Math.round(1.036 * weight * distance * terrainFactor);

  // Equivalences
  const bananas = (calories / 90).toFixed(1);
  const pasta = Math.round(calories / 3.5); // grams of cooked pasta for same kcal

  const resultEl = document.getElementById('calorieResult');
  const valueEl = document.getElementById('calorieResultValue');
  const detailEl = document.getElementById('calorieResultDetail');

  if (resultEl) resultEl.style.display = 'flex';
  if (valueEl) valueEl.textContent = `${calories} kcal`;
  if (detailEl) detailEl.textContent = `≈ ${bananas} bananes ou ${pasta}g de pâtes cuites pour compenser`;
}

// Auto-fill tools from profile
function autoFillTools() {
  const saved = localStorage.getItem('kadence_profile');
  if (!saved) return;
  const p = JSON.parse(saved);

  // HR zones
  const hrAge = document.getElementById('hrAge');
  const hrRest = document.getElementById('hrRest');
  const hrMaxInput = document.getElementById('hrMax');
  if (hrAge && p.age) hrAge.value = p.age;
  if (hrRest && p.fcRepos) hrRest.value = p.fcRepos;
  if (hrMaxInput && p.fcMax) hrMaxInput.value = p.fcMax;

  // BMI
  const bmiWeight = document.getElementById('bmiWeight');
  const bmiHeight = document.getElementById('bmiHeight');
  if (bmiWeight && p.poids) bmiWeight.value = p.poids;
  if (bmiHeight && p.taille) bmiHeight.value = p.taille;

  // Calories
  const calWeight = document.getElementById('calWeight');
  if (calWeight && p.poids) calWeight.value = p.poids;
}

// ==========================================
// PREMIUM — Stripe + PayPal Checkout
// ==========================================

let paypalLoaded = false;
let paypalClientId = null;

function initPremium() {
  // Check URL params for payment return from Stripe
  const urlParams = new URLSearchParams(window.location.search);
  const paymentStatus = urlParams.get('payment');
  const sessionId = urlParams.get('session_id');

  if (paymentStatus === 'success' && sessionId) {
    verifyStripeSession(sessionId);
    window.history.replaceState({}, '', window.location.pathname);
  } else if (paymentStatus === 'cancelled') {
    window.history.replaceState({}, '', window.location.pathname);
  }

  // Check premium status — localStorage first for instant UI
  const isPremium = localStorage.getItem('kadence_premium') === 'true';
  if (isPremium) {
    unlockPremiumContent();
  }

  // Check server-side status if we have an email
  const premiumEmail = localStorage.getItem('kadence_premium_email');
  if (premiumEmail) {
    checkPremiumStatus(premiumEmail);
  }

  // Load PayPal config from server
  loadPayPalConfig();

  // Modal close handlers
  const overlay = document.getElementById('paymentModal');
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closePaymentModal();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePaymentModal();
  });
}

// ── PayPal SDK Loading ─────────────────────

async function loadPayPalConfig() {
  try {
    const response = await fetch('/api/config');
    const config = await response.json();
    paypalClientId = config.paypalClientId;
  } catch (err) {
    console.log('Config serveur indisponible');
  }
}

function loadPayPalSDK(clientId) {
  return new Promise((resolve, reject) => {
    if (paypalLoaded) return resolve();
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=EUR&intent=capture`;
    script.onload = () => { paypalLoaded = true; resolve(); };
    script.onerror = () => reject(new Error('PayPal SDK failed to load'));
    document.head.appendChild(script);
  });
}

function renderPayPalButtons() {
  const container = document.getElementById('paypal-button-container');
  if (!container || !window.paypal) return;

  container.innerHTML = '';

  const email = document.getElementById('payEmail')?.value?.trim();

  window.paypal.Buttons({
    style: {
      layout: 'horizontal',
      color: 'gold',
      shape: 'rect',
      label: 'paypal',
      height: 48,
      tagline: false
    },
    createOrder: async () => {
      const response = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (data.orderId) return data.orderId;
      throw new Error(data.error || 'Erreur PayPal');
    },
    onApprove: async (data) => {
      try {
        const response = await fetch('/api/paypal/capture-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: data.orderID, email })
        });
        const result = await response.json();

        if (result.premium) {
          localStorage.setItem('kadence_premium', 'true');
          localStorage.setItem('kadence_premium_email', result.email || email);
          localStorage.setItem('kadence_premium_date', new Date().toISOString());
          unlockPremiumContent();
          showPaymentSuccess();
        } else {
          alert('Le paiement n\'a pas pu être finalisé. Veuillez réessayer.');
        }
      } catch (err) {
        console.error('Erreur PayPal capture:', err);
        alert('Erreur lors de la finalisation du paiement.');
      }
    },
    onCancel: () => {
      console.log('Paiement PayPal annulé');
    },
    onError: (err) => {
      console.error('Erreur PayPal:', err);
    }
  }).render('#paypal-button-container');
}

// ── Server Status Checks ───────────────────

async function checkPremiumStatus(email) {
  try {
    const response = await fetch(`/api/payment/status?email=${encodeURIComponent(email)}`);
    const data = await response.json();
    if (data.premium) {
      localStorage.setItem('kadence_premium', 'true');
      unlockPremiumContent();
    } else {
      localStorage.removeItem('kadence_premium');
    }
  } catch (err) {
    console.log('Vérification premium serveur indisponible');
  }
}

async function verifyStripeSession(sessionId) {
  try {
    const response = await fetch('/api/payment/verify-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId })
    });
    const data = await response.json();
    if (data.premium) {
      localStorage.setItem('kadence_premium', 'true');
      localStorage.setItem('kadence_premium_email', data.email || '');
      localStorage.setItem('kadence_premium_date', new Date().toISOString());
      unlockPremiumContent();
      showPaymentSuccess();
    }
  } catch (err) {
    console.error('Erreur vérification session:', err);
    localStorage.setItem('kadence_premium', 'true');
    unlockPremiumContent();
    showPaymentSuccess();
  }
}

// ── Modal Navigation ───────────────────────

function showPaymentSuccess() {
  const modal = document.getElementById('paymentModal');
  if (!modal) return;
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';

  document.getElementById('payStep1')?.classList.remove('active');
  document.getElementById('payStep2')?.classList.remove('active');
  document.getElementById('payStep3')?.classList.add('active');
}

function openPaymentModal() {
  if (localStorage.getItem('kadence_premium') === 'true') return;

  const modal = document.getElementById('paymentModal');
  if (!modal) return;
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';

  // Reset to step 1
  document.getElementById('payStep1')?.classList.add('active');
  document.getElementById('payStep2')?.classList.remove('active');
  document.getElementById('payStep3')?.classList.remove('active');

  setTimeout(() => {
    document.getElementById('payEmail')?.focus();
  }, 300);
}

function closePaymentModal() {
  const modal = document.getElementById('paymentModal');
  if (!modal) return;
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

async function goToPaymentMethods() {
  const emailInput = document.getElementById('payEmail');
  const email = emailInput?.value?.trim();

  if (!email || !email.includes('@')) {
    emailInput?.focus();
    shakeButton('payEmail');
    return;
  }

  // Save email
  localStorage.setItem('kadence_premium_email', email);

  // Show step 2
  document.getElementById('payStep1')?.classList.remove('active');
  document.getElementById('payStep2')?.classList.add('active');

  // Load and render PayPal buttons
  if (paypalClientId && paypalClientId !== 'placeholder') {
    try {
      await loadPayPalSDK(paypalClientId);
      renderPayPalButtons();
    } catch (err) {
      console.error('PayPal SDK load error:', err);
      const container = document.getElementById('paypal-button-container');
      if (container) container.style.display = 'none';
    }
  } else {
    const container = document.getElementById('paypal-button-container');
    if (container) container.style.display = 'none';
  }
}

// ── Stripe Checkout Redirect ───────────────

async function redirectToStripeCheckout() {
  const email = document.getElementById('payEmail')?.value?.trim()
    || localStorage.getItem('kadence_premium_email');

  if (!email || !email.includes('@')) {
    alert('Veuillez d\'abord entrer votre email.');
    return;
  }

  const btn = document.getElementById('stripeCheckoutBtn');
  if (btn) {
    btn.classList.add('loading');
    btn.innerHTML = '<span>Redirection vers Stripe...</span>';
  }

  try {
    const response = await fetch('/api/payment/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await response.json();

    if (data.url) {
      window.location.href = data.url;
    } else {
      throw new Error(data.error || 'Erreur de création de session');
    }
  } catch (err) {
    console.error('Erreur Stripe:', err);
    if (btn) {
      btn.classList.remove('loading');
      btn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
          <path d="M1 10h22"/>
        </svg>
        Payer par carte bancaire
      `;
    }
    alert('Erreur de connexion au serveur de paiement. Veuillez réessayer.');
  }
}

// ── Content Unlock ─────────────────────────

function unlockPremiumContent() {
  document.querySelectorAll('.premium-content-card').forEach(card => {
    card.classList.add('unlocked');
  });

  const premiumBtn = document.querySelector('.pricing-card-premium .btn-premium');
  if (premiumBtn) {
    premiumBtn.textContent = '✓ Vous êtes Premium';
    premiumBtn.style.pointerEvents = 'none';
    premiumBtn.style.background = 'var(--gradient-main)';
  }

  document.querySelectorAll('.nav-premium').forEach(link => {
    link.innerHTML = '✦ Premium ✓';
  });
}

