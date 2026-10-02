/**
 * Mobile Virtual Gamepad overlay
 */

function setupMobileControls() {
    // Only set up if on a touch device or running in Capacitor
    const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    const isCapacitor = !!window.Capacitor;
    
    if (!isTouch && !isCapacitor) return;

    console.log("Setting up mobile controls...");
    document.body.classList.add('mobile-mode');
    
    const controlsHTML = `
        <div id="mobile-gamepad" class="mobile-gamepad hidden">
            <!-- Left side: D-Pad -->
            <div class="d-pad">
                <button class="d-btn btn-up" data-key="w">▲</button>
                <div class="d-pad-row">
                    <button class="d-btn btn-left" data-key="a">◀</button>
                    <button class="d-btn btn-right" data-key="d">▶</button>
                </div>
            </div>
            
            <!-- Right side: Action Buttons -->
            <div class="action-pad">
                <button class="a-btn btn-light" data-key="j">L</button>
                <button class="a-btn btn-heavy" data-key="k">H</button>
                <button class="a-btn btn-defend" data-key="l">DEF</button>
                <button class="a-btn btn-dodge" data-key=" ">DODGE</button>
                <button class="a-btn btn-heal" data-key="h">HEAL</button>
            </div>
        </div>
    `;
    
    const wrapper = document.createElement('div');
    wrapper.innerHTML = controlsHTML;
    document.body.appendChild(wrapper.firstElementChild);
    
    const gamepad = document.getElementById('mobile-gamepad');
    
    // Add touch listeners
    const buttons = gamepad.querySelectorAll('button');
    buttons.forEach(btn => {
        const key = btn.getAttribute('data-key');
        
        btn.style.touchAction = 'none';
        
        btn.addEventListener('pointerdown', (e) => {
            e.preventDefault(); // prevent mouse emulation
            btn.classList.add('active');
            window.dispatchEvent(new CustomEvent('mobile-keydown', { 
                detail: { key: key }
            }));
        }, { passive: false });
        
        const endTouch = (e) => {
            e.preventDefault();
            btn.classList.remove('active');
            window.dispatchEvent(new CustomEvent('mobile-keyup', { 
                detail: { key: key }
            }));
        };
        
        btn.addEventListener('pointerup', endTouch, { passive: false });
        btn.addEventListener('pointercancel', endTouch, { passive: false });
    });
    
    // Show/hide logic
    // We want to show gamepad ONLY when battle-screen or boss-screen is active
    const observer = new MutationObserver((mutations) => {
        const battleActive = document.getElementById('battle-screen').classList.contains('active');
        const bossActive = document.getElementById('boss-screen').classList.contains('active');
        if (battleActive || bossActive) {
            gamepad.classList.remove('hidden');
        } else {
            gamepad.classList.add('hidden');
        }
    });
    
    observer.observe(document.getElementById('battle-screen'), { attributes: true, attributeFilter: ['class'] });
    observer.observe(document.getElementById('boss-screen'), { attributes: true, attributeFilter: ['class'] });
}

document.addEventListener('DOMContentLoaded', setupMobileControls);
