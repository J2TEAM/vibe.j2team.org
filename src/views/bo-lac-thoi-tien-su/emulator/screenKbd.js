/* oxlint-disable */
 
 
/*
#sh.. integrate this.
should keyrepeat functionality be here/in key ?
but we'd need to reuse repeat

should unify key handling, bool up down
and handle maximize down by flipping fractionscale + autoscale
*/

export const kbdWidth = 220, kbdHeight = 220;

const touchKeyMap = new Map(); // Map<touch.identifier, Element>
let handleKey = null;

function getKeyAtPoint(x, y) {
    return document.elementFromPoint(x, y)?.closest('.key');
}

function activateKey(key) {
    if (key && !key.classList.contains('active')) {
        key.classList.add('active');
        if (handleKey) {
            handleKey(true, key.dataset.key);
        }
    }
}

function deactivateKey(key) {
    if (key && key.classList.contains('active')) {
        key.classList.remove('active');
        if (handleKey) {
            handleKey(false, key.dataset.key);
        }
    }
}

// Handle touch start
function handleTouchStart(e) {
    e.preventDefault();
    const touches = e.changedTouches;
    for (let i = 0; i < touches.length; i++) {
        const touch = touches[i];
        const key = getKeyAtPoint(touch.clientX, touch.clientY);
        if (key) {
            touchKeyMap.set(touch.identifier, key);
            activateKey(key);
        }
    }
}

// Handle touch move
function handleTouchMove(e) {
    e.preventDefault();
    const touches = e.changedTouches;
    for (let i = 0; i < touches.length; i++) {
        const touch = touches[i];
        const currentKey = getKeyAtPoint(touch.clientX, touch.clientY);
        const previousKey = touchKeyMap.get(touch.identifier);

        // If the touch moved to a new key
        if (currentKey !== previousKey) {
            // Deactivate the previous key
            deactivateKey(previousKey);
            // Activate the new key
            if (currentKey) {
                activateKey(currentKey);
                touchKeyMap.set(touch.identifier, currentKey);
            } else {
                touchKeyMap.delete(touch.identifier);
            }
        }
    }
}

// Handle touch end or cancel
function handleTouchEnd(e) {
    e.preventDefault();
    const touches = e.changedTouches;
    for (let i = 0; i < touches.length; i++) {
        const touch = touches[i];
        const key = touchKeyMap.get(touch.identifier);
        if (key) {
            deactivateKey(key);
            touchKeyMap.delete(touch.identifier);
        }
    }
}

export function initKbdListeners() {
    // Add touch event listeners to keypad areas
    const keypads = document.querySelectorAll('.keypad-part');
    keypads.forEach(keypad => {
        keypad.addEventListener('touchstart', handleTouchStart, { passive: false });
        keypad.addEventListener('touchmove', handleTouchMove, { passive: false });
        keypad.addEventListener('touchend', handleTouchEnd, { passive: false });
        keypad.addEventListener('touchcancel', handleTouchEnd, { passive: false });
    });
}

export function setKbdHandler(handler) {
    handleKey = handler;
}