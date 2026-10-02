Created At: 2026-09-07T16:04:37+05:30
Completed At: 2026-09-07T16:04:37+05:30
File Path: `file:///d:/CLONED/Culture_Game/Culture_Game%20FULL%20DEMO/Culture_Game%20FULL/frontend/js/combat-engine.js`
Total Lines: 1034
Total Bytes: 41099
Showing lines 1 to 800
The following code has been modified to include a line number before every line, in the format: <line_number>: <original_line>. Please note that any changes targeting the original code should remove the line number, colon, and leading space.
1: /**
2:  * Culture Game - Real-Time 2D Combat Engine
3:  */
4: 
5: class InputManager {
6:     constructor() {
7:         this.keys = {};
8:         
9:         this._keydownHandler = (e) => {
10:             if (['w', 'a', 's', 'd', 'j', 'k', 'l', 'h', ' ', 'shift'].includes(e.key.toLowerCase())) {
11:                 this.keys[e.key.toLowerCase()] = true;
12:                 if (e.key === ' ' || e.key.toLowerCase() === 'w') e.preventDefault();
13:             }
14:             if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
15:                 this.keys[e.key] = true;
16:                 e.preventDefault();
17:             }
18:         };
19:         
20:         this._keyupHandler = (e) => {
21:             if (['w', 'a', 's', 'd', 'j', 'k', 'l', 'h', ' ', 'shift'].includes(e.key.toLowerCase())) {
22:                 this.keys[e.key.toLowerCase()] = false;
23:             }
24:             if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
25:                 this.keys[e.key] = false;
26:             }
27:         };
28:         
29:         window.addEventListener('keydown', this._keydownHandler);
30:         window.addEventListener('keyup', this._keyupHandler);
31:     }
32:     
33:     destroy() {
34:         window.removeEventListener('keydown', this._keydownHandler);
35:         window.removeEventListener('keyup', this._keyupHandler);
36:     }
37: 
38:     isDown(key, altKey = null) {
39:         return !!this.keys[key] || (altKey ? !!this.keys[altKey] : false);
40:     }
41:     
42:     consume(key, altKey = null) {
43:         if (this.keys[key]) {
44:             this.keys[key] = false;
45:             return true;
46:         }
47:         if (altKey && this.keys[altKey]) {
48:             this.keys[altKey] = false;
49:             return true;
50:         }
51:         return false;
52:     }
53: }
54: 
55: class CollisionManager {
56:     static checkAABB(rect1, rect2) {
57:         return (
58:             rect1.x < rect2.x + rect2.width &&
59:             rect1.x + rect1.width > rect2.x &&
60:             rect1.y < rect2.y + rect2.height &&
61:             rect1.y + rect1.height > rect2.y
62:         );
63:     }
64: }
65: 
66: class CombatEngine {
67:     constructor(containerId, options = {}) {
68:         this.container = document.getElementById(containerId);
69:         this.width = this.container.clientWidth;
70:         this.height = this.container.clientHeight;
71:         
72:         // Logical coordinates: width maps to 1000 logical units
73:         this.logicalWidth = 1000;
74:         this.scale = this.width / this.logicalWidth;
75:         
76:         this.input = new InputManager();
77:         
78:         this.hero = null;
79:         this.enemy = null;
80:         
81:         this.lastTime = 0;
82:         this.running = false;
83:         
84:         this.onWin = options.onWin || null;
85:         this.onLose = options.onLose || null;
86:         
87:         // Handle resize
88:         window.addEventListener('resize', () => {
89:             if (!this.container) return;
90:             this.width = this.container.clientWidth;
91:             this.height = this.container.clientHeight;
92:             this.scale = this.width / this.logicalWidth;
93:         });
94:     }
95: 
96:     start(heroConfig, enemyConfig) {
97:         this.container.innerHTML = ''; // Clear previous combat
98:         
99:         // Apply environment styling
100:         // Arena Visuals
101:         const arenaClass = heroConfig.arenaClass || 'arena-kerala';
102:         if (arenaClass) {
103:             this.container.classList.add(arenaClass);
104:             // Remove ground border if arena handles it natively
105:         } else {
106:             // Default visual ground
107:             const ground = document.createElement('div');
108:             ground.style.position = 'absolute';
109:             ground.style.bottom = '0';
110:             ground.style.left = '0';
111:             ground.style.width = '100%';
112:             ground.style.height = '40px';
113:             ground.style.background = '#222';
114:             ground.style.borderTop = '2px solid #555';
115:             this.container.appendChild(ground);
116:         }
117: 
118:         this.hero = new Fighter(this, Object.assign({}, heroConfig, { isPlayer: true, x: 280, direction: 1 }));
119:         this.enemy = new Fighter(this, Object.assign({}, enemyConfig, { isPlayer: false, x: 720, direction: -1 }));
120:         
121:         this.hero.opponent = this.enemy;
122:         this.enemy.opponent = this.hero;
123:         
124:         this.lastTime = performance.now();
125:         this.running = true;
126:         requestAnimationFrame((t) => this.loop(t));
127:     }
128: 
129:     stop() {
130:         this.running = false;
131:         if (this.input) {
132:             this.input.destroy();
133:         }
134:     }
135: 
136:     loop(timestamp) {
137:         if (!this.running) return;
138:         
139:         let targetFPS = 60;
140:         if (window.gameState && window.gameState.fps) {
141:             targetFPS = window.gameState.fps;
142:         } else {
143:             const stored = parseInt(localStorage.getItem('culture_game_fps'), 10);
144:             if (!isNaN(stored)) targetFPS = stored;
145:         }
146:         
147:         const frameTime = 1000 / targetFPS;
148:         
149:         // Enforce frame cap
150:         if (timestamp - this.lastTime < frameTime) {
151:             requestAnimationFrame((t) => this.loop(t));
152:             return;
153:         }
154:         
155:         const deltaTime = (timestamp - this.lastTime) / 1000; // in seconds
156:         this.lastTime = timestamp;
157:         
158:         // Limit delta time to prevent huge jumps if tab is inactive
159:         const dt = Math.min(deltaTime, 0.1);
160:         
161:         this.update(dt);
162:         this.render();
163:         
164:         requestAnimationFrame((t) => this.loop(t));
165:     }
166: 
167:     update(dt) {
168:         this.hero.update(dt);
169:         this.enemy.update(dt);
170:         
171:         // Check win/lose
172:         if (this.enemy.state === 'DEFEAT' && this.hero.state !== 'VICTORY') {
173:             this.hero.setState('VICTORY');
174:             if (this.onWin) setTimeout(this.onWin, 3000);
175:         } else if (this.hero.state === 'DEFEAT' && this.enemy.state !== 'VICTORY') {
176:             this.enemy.setState('VICTORY');
177:             if (this.onLose) setTimeout(this.onLose, 3000);
178:         }
179:     }
180: 
181:     render() {
182:         this.hero.render();
183:         this.enemy.render();
184:     }
185: }
186: 
187: class Fighter {
188:     constructor(engine, config) {
189:         this.engine = engine;
190:         this.isPlayer = config.isPlayer;
191:         this.isBoss = config.isBoss || false;
192:         
193:         this.x = config.x || 0;
194:         this.y = 0; // 0 is floor level
195:         
196:         // Logical dimensions of the physical body (hurtbox)
197:         this.width = 80; 
198:         this.height = 200; 
199:         
200:         // Logical dimensions of the rendered sprite canvas (viewBox equivalent)
201:         this.logicalSpriteWidth = 250;
202:         this.logicalSpriteHeight = 250;
203:         
204:         this.vx = 0;
205:         this.vy = 0;
206:         this.direction = config.direction || 1; // 1 = right, -1 = left
207:         
208:         this.health = config.maxHealth || 100;
209:         this.maxHealth = config.maxHealth || 100;
210:         this.stamina = 100;
211:         this.maxStamina = 100;
212:         this.name = config.name || "Fighter";
213:         this.folder = config.folder || "kerala";
214:         
215:         this.state = 'IDLE';
216:         this.stateTime = 0;
217:         
218:         this.healCooldown = 0;
219:         this.dodgeCooldown = 0;
220:         this.healAmount = 20;
221:         
222:         this.opponent = null;
223:         
224:         // Physics constants
225:         this.gravity = 1500;
226:         this.jumpForce = 700;
227:         this.walkSpeed = 250;
228:         this.runSpeed = 450;
229:         this.dodgeSpeed = 500;
230:         
231:         // Attack definitions
232:         this.attacks = {
233:             light: { windup: 0.2, active: 0.1, recovery: 0.3, damage: 15, reach: 90, pushback: 100 },
234:             heavy: { windup: 0.4, active: 0.15, recovery: 0.5, damage: 25, reach: 110, pushback: 300 }
235:         };
236:         this.currentAttack = null;
237:         this.hasHitInActiveFrame = false;
238:         
239:         // Visual DOM element (Advanced CSS/JS Rig)
240:         this.element = this.createRig();
241:         this.engine.container.appendChild(this.element);
242:         this.aiStateTime = 0;
243:         this.aiDecisionInterval = 0.5 + Math.random() * 0.5;
244:         this.aiCooldown = 0;
245:         this.aiComboStep = 0;
246:         this.aiReactionDelay = 0;
247:         this.aiTargetAction = null;
248:         this.aiRecentAction = null;
249:         
250:         // Player State
251:         this.comboBuffer = null;
252:         this.dodgeCooldown = 0;
253:     }
254:     
255:     createRig() {
256:         const container = document.createElement('div');
257:         container.className = 'fighter-rig';
258:         
259:         if (this.isPlayer) container.classList.add('hero-rig');
260:         else if (this.isBoss) container.classList.add('boss-rig');
261:         else container.classList.add('enemy-rig');
262: 
263:         const elements = {};
264:         
265:         elements.torso = document.createElement('div');
266:         elements.torso.className = 'rig-part rig-torso';
267:         
268:         elements.head = document.createElement('div');
269:         elements.head.className = 'rig-part rig-head';
270:         
271:         elements.armUpperL = document.createElement('div');
272:         elements.armUpperL.className = 'rig-part rig-arm-upper-l';
273:         elements.armLowerL = document.createElement('div');
274:         elements.armLowerL.className = 'rig-part rig-arm-lower-l';
275:         elements.handL = document.createElement('div');
276:         elements.handL.className = 'rig-part rig-hand-l';
277:         // We will append shield to handL later
278:         
279:         elements.armUpperR = document.createElement('div');
280:         elements.armUpperR.className = 'rig-part rig-arm-upper-r';
281:         elements.armLowerR = document.createElement('div');
282:         elements.armLowerR.className = 'rig-part rig-arm-lower-r';
283:         elements.handR = document.createElement('div');
284:         elements.handR.className = 'rig-part rig-hand-r';
285:         
286:         elements.legUpperL = document.createElement('div');
287:         elements.legUpperL.className = 'rig-part rig-leg-upper-l';
288:         elements.legLowerL = document.createElement('div');
289:         elements.legLowerL.className = 'rig-part rig-leg-lower-l';
290:         elements.footL = document.createElement('div');
291:         elements.footL.className = 'rig-part rig-foot-l';
292:         
293:         elements.legUpperR = document.createElement('div');
294:         elements.legUpperR.className = 'rig-part rig-leg-upper-r';
295:         elements.legLowerR = document.createElement('div');
296:         elements.legLowerR.className = 'rig-part rig-leg-lower-r';
297:         elements.footR = document.createElement('div');
298:         elements.footR.className = 'rig-part rig-foot-r';
299: 
300:         elements.weapon = document.createElement('div');
301:         elements.weapon.className = 'rig-part rig-weapon';
302: 
303:         elements.shield = document.createElement('div');
304:         elements.shield.className = 'rig-part rig-shield';
305: 
306:         // Build hierarchy
307:         elements.armLowerL.appendChild(elements.handL);
308:         elements.armUpperL.appendChild(elements.armLowerL);
309:         
310:         elements.armLowerR.appendChild(elements.handR);
311:         elements.armUpperR.appendChild(elements.armLowerR);
312:         
313:         elements.legLowerL.appendChild(elements.footL);
314:         elements.legUpperL.appendChild(elements.legLowerL);
315:         
316:         elements.legLowerR.appendChild(elements.footR);
317:         elements.legUpperR.appendChild(elements.legLowerR);
318:         
319:         // Weapon in hand
320:         elements.handR.appendChild(elements.weapon);
321:         elements.handL.appendChild(elements.shield);
322:         
323:         elements.torso.appendChild(elements.head);
324:         elements.torso.appendChild(elements.armUpperL);
325:         elements.torso.appendChild(elements.armUpperR);
326:         elements.torso.appendChild(elements.legUpperL);
327:         elements.torso.appendChild(elements.legUpperR);
328: 
329:         container.appendChild(elements.torso);
330: 
331:         this.parts = elements;
332:         this.parts.container = container;
333:         
334:         if (typeof RigAnimator !== 'undefined') {
335:             this.animator = new RigAnimator(this.parts, this.isBoss);
336:         } else {
337:             console.error('RigAnimator is missing!');
338:         }
339: 
340:         return container;
341:     }
342: 
343:     setState(newState) {
344:         if (this.state === 'DEFEAT') return; // Cannot change state if defeated
345:         this.state = newState;
346:         this.stateTime = 0;
347:         this.hasHitInActiveFrame = false;
348:     }
349: 
350:     takeDamage(amount, pushback) {
351:         if (['DEFEAT', 'DODGE'].includes(this.state)) return; // i-frames
352:         
353:         let actualDamage = amount;
354:         let isBlocked = false;
355:         
356:         // Real Defense: Defender must be facing the attacker to block
357:         const isFacingAttacker = (this.direction === -this.opponent.direction);
358:         
359:         if (this.state === 'DEFEND' && this.stamina > 0 && isFacingAttacker) {
360:             isBlocked = true;
361:             actualDamage = Math.floor(amount / 5); // 80% damage reduction
362:             this.stamina -= (amount * 1.5); 
363:             this.engine.container.classList.add('shake-small');
364:             setTimeout(() => this.engine.container.classList.remove('shake-small'), 200);
365:             this.vx = (this.opponent.x < this.x ? 1 : -1) * (pushback * 0.3); // much less pushback
366:             
367:             this.spawnParticles('#f2c94c', 4, true); // Sparks
368:             
369:             if (this.stamina <= 0) {
370:                 this.stamina = 0;
371:                 this.setState('HIT'); // Guard break
372:                 this.showDamage("GUARD BREAK!", false);
373:                 this.vx = (this.opponent.x < this.x ? 1 : -1) * pushback;
374:             }
375:         } else {
376:             if (pushback > 150) {
377:                 this.setState('KNOCKBACK');
378:             } else {
379:                 this.setState('HIT'); // stagger
380:             }
381:             this.engine.container.classList.add('shake');
382:             setTimeout(() => this.engine.container.classList.remove('shake'), 400);
383:             this.vx = (this.opponent.x < this.x ? 1 : -1) * pushback;
384:             
385:             this.spawnParticles('#ff3b3b', 10, false); // Blood
386:         }
387:         
388:         this.health -= actualDamage;
389:         if (this.health <= 0) {
390:             this.health = 0;
391:             this.setState('DEFEAT');
392:         }
393:         
394:         this.showDamage(actualDamage, isBlocked);
395:         if (typeof updateHealthBars === 'function') updateHealthBars();
396:     }
397: 
398:     spawnParticles(color, count, isShieldBlock = false) {
399:         for(let i=0; i<count; i++) {
400:             const p = document.createElement('div');
401:             p.style.position = 'absolute';
402:             p.style.width = '4px';
403:             p.style.height = '4px';
404:             p.style.backgroundColor = color;
405:             p.style.borderRadius = '50%';
406:             p.style.zIndex = '100';
407:             
408:             const renderX = (this.x + (isShieldBlock ? this.direction * 30 : 0)) * this.engine.scale + ((Math.random() - 0.5) * 20);
409:             const renderY = (this.y + 40) * this.engine.scale + ((Math.random() - 0.5) * 20) + 40; // Add 40 to account for ground offset in CSS
410:             
411:             p.style.left = `${renderX}px`;
412:             p.style.bottom = `${renderY}px`;
413:             
414:             const vx = (Math.random() - 0.5) * 200;
415:             const vy = (Math.random()) * 200 + 50;
416:             
417:             this.engine.container.appendChild(p);
418:             
419:             let posX = renderX;
420:             let posY = renderY;
421:             let time = 0;
422:             
423:             const anim = setInterval(() => {
424:                 time += 0.016;
425:                 posX += vx * 0.016;
426:                 posY += (vy - 800 * time) * 0.016; // gravity
427:                 p.style.left = `${posX}px`;
428:                 p.style.bottom = `${posY}px`;
429:                 p.style.opacity = Math.max(0, 1 - (time * 1.5));
430:                 if (time > 0.6) {
431:                     clearInterval(anim);
432:                     if (p.parentNode) p.parentNode.removeChild(p);
433:                 }
434:             }, 16);
435:         }
436:     }
437:     
438:     showDamage(amount, blocked) {
439:         const dmgText = document.createElement('div');
440:         dmgText.className = 'engine-damage-text';
441:         dmgText.textContent = blocked ? `Blocked! (-${amount})` : `-${amount}`;
442:         dmgText.style.color = blocked ? '#f2c94c' : '#ff3b3b';
443:         
444:         const renderX = this.x * this.engine.scale;
445:         const renderY = (this.y + this.height + 20) * this.engine.scale + 40;
446:         
447:         dmgText.style.left = `${renderX - 30}px`;
448:         dmgText.style.bottom = `${renderY}px`;
449:         
450:         this.engine.container.appendChild(dmgText);
451:         
452:         // Trigger CSS transition
453:         setTimeout(() => {
454:             dmgText.style.transform = 'translateY(-50px)';
455:             dmgText.style.opacity = '0';
456:         }, 10);
457:         
458:         setTimeout(() => {
459:             if (dmgText.parentNode) dmgText.parentNode.removeChild(dmgText);
460:         }, 1000);
461:     }
462: 
463:     getHurtbox() {
464:         return {
465:             x: this.x - this.width/2,
466:             y: this.y,
467:             width: this.width,
468:             height: this.height
469:         };
470:     }
471: 
472:     getHitbox(attackConf) {
473:         const width = attackConf.reach;
474:         const height = 40;
475:         return {
476:             x: this.direction === 1 ? this.x + this.width/2 : this.x - this.width/2 - width,
477:             y: this.y + 70, // Chest height
478:             width: width,
479:             height: height
480:         };
481:     }
482: 
483:     update(dt) {
484:         this.stateTime += dt;
485:         
486:         if (this.healCooldown > 0) {
487:             this.healCooldown -= dt;
488:         }
489:         
490:         if (this.state !== 'DEFEND' && this.state !== 'ATTACK' && this.state !== 'HEAVY_ATTACK' && this.state !== 'HEAL') {
491:             this.stamina = Math.min(this.maxStamina, this.stamina + 20 * dt); // Regen stamina
492:         }
493:         
494:         // Face opponent unless in specific states
495:         if (!['ATTACK', 'HEAVY_ATTACK', 'HIT', 'KNOCKBACK', 'DEFEAT', 'HEAL'].includes(this.state) && this.opponent) {
496:             this.direction = this.opponent.x > this.x ? 1 : -1;
497:         }
498: 
499:         // Apply Gravity
500:         if (this.y > 0) {
501:             this.vy -= this.gravity * dt;
502:         }
503:         
504:         // Movement processing based on state
505:         if (this.isPlayer) {
506:             this.updatePlayerInput(dt);
507:         } else {
508:             this.updateAI(dt);
509:         }
510: 
511:         // Process Combat States
512:         if (this.state === 'ATTACK' || this.state === 'HEAVY_ATTACK') {
513:             this.vx = 0; // stop moving
514:             const atk = this.currentAttack;
515:             const totalAtkTime = atk.windup + atk.active + atk.recovery;
516:             const progress = this.stateTime / totalAtkTime;
517:             
518:             if (this.animator) {
519:                 this.animator.setPose(this.state === 'ATTACK' ? 'ATTACK_LIGHT' : 'ATTACK_HEAVY', progress);
520:             }
521:             
522:             // Active frame collision check
523:             if (this.stateTime > atk.windup && this.stateTime < atk.windup + atk.active) {
524:                 if (!this.hasHitInActiveFrame) {
525:                     const hitbox = this.getHitbox(atk);
526:                     const opponentHurtbox = this.opponent.getHurtbox();
527:                     
528:                     if (CollisionManager.checkAABB(hitbox, opponentHurtbox)) {
529:                         this.opponent.takeDamage(atk.damage, atk.pushback);
530:                         this.hasHitInActiveFrame = true;
531:                     }
532:                 }
533:             }
534:             
535:             // Recovery
536:             if (this.stateTime > totalAtkTime) {
537:                 this.setState('IDLE');
538:             }
539:         }
540:         else if (this.state === 'HIT') {
541:             if (this.animator) this.animator.setPose('HIT');
542:             // Stagger (short recovery)
543:             if (this.stateTime > 0.3) {
544:                 this.setState('IDLE');
545:             }
546:         }
547:         else if (this.state === 'KNOCKBACK') {
548:             if (this.animator) this.animator.setPose('KNOCKBACK');
549:             // Heavy hit (long recovery)
550:             if (this.stateTime > 0.6) {
551:                 this.setState('IDLE');
552:             }
553:         }
554:         else if (this.state === 'DODGE') {
555:             if (this.animator) this.animator.setPose('DODGE');
556:             // Dash velocity
557:             this.vx = -this.direction * this.dodgeSpeed;
558:             if (this.stateTime > 0.4) {
559:                 this.setState('IDLE');
560:                 this.vx = 0;
561:             }
562:         }
563:         else if (this.state === 'HEAL') {
564:             if (this.animator) this.animator.setPose('DEFEND');
565:             this.vx = 0;
566:             // Healing animation takes 1 second
567:             if (this.stateTime > 1.0) {
568:                 this.health = Math.min(this.maxHealth, this.health + this.healAmount);
569:                 this.healCooldown = 5.0; // 5 seconds cooldown
570:                 
571:                 const healText = document.createElement('div');
572:                 healText.className = 'engine-damage-text';
573:                 healText.textContent = `+${this.healAmount}`;
574:                 healText.style.color = '#4caf50';
575:                 
576:                 const renderX = this.x * this.engine.scale;
577:                 const renderY = (this.y + this.height + 20) * this.engine.scale + 40;
578:                 healText.style.left = `${renderX - 10}px`;
579:                 healText.style.bottom = `${renderY}px`;
580:                 this.engine.container.appendChild(healText);
581:                 setTimeout(() => { healText.style.transform = 'translateY(-50px)'; healText.style.opacity = '0'; }, 10);
582:                 setTimeout(() => { if (healText.parentNode) healText.parentNode.removeChild(healText); }, 1000);
583:                 
584:                 if (typeof updateHealthBars === 'function') updateHealthBars();
585:                 this.setState('IDLE');
586:             }
587:         }
588:         
589:         // Physics: Apply Friction for smooth deceleration if not actively dashing
590:         if (this.state !== 'DODGE') {
591:             const friction = 2000;
592:             if (this.vx > 0) {
593:                 this.vx = Math.max(0, this.vx - friction * dt);
594:             } else if (this.vx < 0) {
595:                 this.vx = Math.min(0, this.vx + friction * dt);
596:             }
597:         }
598:         
599:         // Update Positions
600:         let nextX = this.x + this.vx * dt;
601:         let nextY = this.y + this.vy * dt;
602:         
603:         // Floor collision
604:         if (nextY <= 0) {
605:             nextY = 0;
606:             if (this.vy < 0) {
607:                 this.vy = 0;
608:                 if (this.state === 'JUMP') {
609:                     this.setState('IDLE');
610:                 }
611:             }
612:         }
613:         
614:         // Character Collision (Prevent walking through each other)
615:         if (this.opponent) {
616:             const boundPadding = this.width / 2;
617:             const oppX = this.opponent.x;
618:             const myDist = nextX - oppX;
619:             // If we are crossing the opponent's center line, block it
620:             if (this.x <= oppX && nextX + boundPadding > oppX - boundPadding) {
621:                 // I was on the left, trying to move right past opponent's left edge
622:                 nextX = oppX - boundPadding * 2;
623:                 this.vx = 0;
624:             } else if (this.x >= oppX && nextX - boundPadding < oppX + boundPadding) {
625:                 // I was on the right, trying to move left past opponent's right edge
626:                 nextX = oppX + boundPadding * 2;
627:                 this.vx = 0;
628:             }
629:         }
630:         
631:         // Arena Boundaries (Strict constraint based on complete visual sprite to prevent clipping)
632:         const arenaPadding = this.logicalSpriteWidth / 2;
633:         
634:         if (nextX < arenaPadding) {
635:             nextX = arenaPadding;
636:             this.vx = 0;
637:         }
638:         if (nextX > this.engine.logicalWidth - arenaPadding) {
639:             nextX = this.engine.logicalWidth - arenaPadding;
640:             this.vx = 0;
641:         }
642:         
643:         this.x = nextX;
644:         this.y = nextY;
645:     }
646: 
647:     updatePlayerInput(dt) {
648:         if (this.dodgeCooldown > 0) this.dodgeCooldown -= dt;
649:         
650:         // Lock controls during heavy hit reactions, defeat, healing, or victory
651:         if (['HIT', 'KNOCKBACK', 'DEFEAT', 'VICTORY', 'HEAL', 'DODGE'].includes(this.state)) return;
652:         
653:         const input = this.engine.input;
654:         
655:         // Heal
656:         if (input.consume('h')) {
657:             if (this.healCooldown <= 0 && this.health < this.maxHealth) {
658:                 this.setState('HEAL');
659:                 return;
660:             }
661:         }
662:         
663:         // Handle Attack and Combos
664:         let attackQueued = null;
665:         if (input.consume('j')) attackQueued = this.attacks.light;
666:         if (input.consume('k')) attackQueued = this.attacks.heavy;
667:         
668:         if (['ATTACK', 'HEAVY_ATTACK'].includes(this.state)) {
669:             const atk = this.currentAttack;
670:             
671:             // Buffer inputs pressed during the active/recovery phase
672:             if (attackQueued && this.stateTime >= atk.windup) {
673:                 this.comboBuffer = attackQueued;
674:             }
675:             
676:             // If in recovery phase and we have a buffered combo (and the last attack actually hit!)
677:             if (this.comboBuffer && this.hasHitInActiveFrame && this.stateTime > atk.windup + atk.active) {
678:                 this.setState(this.comboBuffer === this.attacks.light ? 'ATTACK' : 'HEAVY_ATTACK');
679:                 this.currentAttack = this.comboBuffer;
680:                 this.comboBuffer = null;
681:             }
682:             return; // Can't do anything else while attacking
683:         }
684:         
685:         // If an attack was pressed from idle
686:         if (attackQueued) {
687:             this.setState(attackQueued === this.attacks.light ? 'ATTACK' : 'HEAVY_ATTACK');
688:             this.currentAttack = attackQueued;
689:             this.comboBuffer = null;
690:             return;
691:         }
692:         
693:         // Dodge
694:         if (input.consume(' ')) {
695:             if (this.dodgeCooldown <= 0) {
696:                 this.setState('DODGE');
697:                 this.dodgeCooldown = 1.5;
698:                 // Add initial burst velocity
699:                 this.vx = -this.direction * this.dodgeSpeed;
700:                 return;
701:             }
702:         }
703:         
704:         // Defense
705:         if (input.isDown('l')) {
706:             if (this.stamina > 0) {
707:                 this.setState('DEFEND');
708:                 this.stamina -= 5 * dt; // Drain slowly while holding block
709:                 return;
710:             } else {
711:                 if (this.state === 'DEFEND') this.setState('IDLE');
712:             }
713:         } else if (this.state === 'DEFEND') {
714:             this.setState('IDLE');
715:         }
716:         
717:         // Movement (Acceleration-based)
718:         if (this.state !== 'JUMP') {
719:             let isMoving = false;
720:             
721:             const isRunning = input.isDown('shift');
722:             const targetSpeed = isRunning ? this.runSpeed : this.walkSpeed;
723:             const acceleration = 3000;
724:             
725:             if (input.isDown('a', 'ArrowLeft')) {
726:                 this.vx -= acceleration * dt;
727:                 if (this.vx < -targetSpeed) this.vx = -targetSpeed;
728:                 isMoving = true;
729:                 this.direction = -1; // Face left while moving left
730:             } else if (input.isDown('d', 'ArrowRight')) {
731:                 this.vx += acceleration * dt;
732:                 if (this.vx > targetSpeed) this.vx = targetSpeed;
733:                 isMoving = true;
734:                 this.direction = 1; // Face right while moving right
735:             }
736:             
737:             // W or Up Arrow for jump (only if on ground)
738:             if (input.consume('w', 'ArrowUp') && this.y === 0) {
739:                 this.vy = this.jumpForce;
740:                 this.setState('JUMP');
741:             } else if (isMoving) {
742:                 this.setState(isRunning ? 'RUN' : 'WALK');
743:             } else if (Math.abs(this.vx) < 10) {
744:                 this.setState('IDLE');
745:             }
746:             
747:             // Set animator states for movement
748:             if (this.animator) {
749:                 if (this.state === 'JUMP') this.animator.setPose('JUMP');
750:                 else if (this.state === 'RUN') this.animator.setPose('RUN');
751:                 else if (this.state === 'WALK') this.animator.setPose('WALK');
752:                 else if (this.state === 'IDLE') this.animator.setPose('IDLE');
753:                 else if (this.state === 'DEFEND') this.animator.setPose('DEFEND');
754:             }
755:         } else {
756:             // Air control (Acceleration)
757:             const airAccel = 1000;
758:             if (input.isDown('a', 'ArrowLeft')) {
759:                 this.vx -= airAccel * dt;
760:                 if (this.vx < -this.walkSpeed) this.vx = -this.walkSpeed;
761:             } else if (input.isDown('d', 'ArrowRight')) {
762:                 this.vx += airAccel * dt;
763:                 if (this.vx > this.walkSpeed) this.vx = this.walkSpeed;
764:             }
765:         }
766:     }
767: 
768:     updateAI(dt) {
769:         if (['HIT', 'KNOCKBACK', 'DEFEAT', 'DODGE', 'VICTORY'].includes(this.state)) {
770:             // Cannot decide new actions while physically locked
771:             this.aiReactionDelay = 0;
772:             this.aiTargetAction = null;
773:             return;
774:         }
775:         
776:         const opp = this.opponent;
777:         if (!opp) return;
778:         
779:         const dist = Math.abs(this.x - opp.x);
780:         
781:         // Check if currently attacking to handle combo chaining (Commitment phase)
782:         if (['ATTACK', 'HEAVY_ATTACK'].includes(this.state)) {
783:             const atk = this.currentAttack;
784:             // Only allow chaining during late active or recovery phase
785:             if (this.stateTime < atk.windup + atk.active + 0.1) return;
786:             
787:             if (this.aiComboStep > 0 && dist < 120) {
788:                 this.setState(this.aiComboStep === 1 ? 'ATTACK' : 'HEAVY_ATTACK');
789:                 this.currentAttack = this.aiComboStep === 1 ? this.attacks.light : this.attacks.heavy;
790:                 this.aiComboStep = this.aiComboStep === 1 ? 2 : 0;
791:                 this.aiCooldown = this.currentAttack.windup + this.currentAttack.active;
792:             } else {
793:                 this.aiComboStep = 0;
794:             }
795:             return;
796:         }
797:         
798:         this.aiStateTime += dt;
799:         
800:         // Handle Queued Actions (Simulates human decision commitment)
The above content does NOT show the entire file contents. If you need to view any lines of the file which were not shown to complete your task, call this tool again to view those lines.
